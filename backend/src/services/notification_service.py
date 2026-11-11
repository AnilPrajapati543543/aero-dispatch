"""
Amazon SNS (SMS) & Amazon SES (Email) Notification Service.

Provides:
1. Amazon SNS: Sends SMS alerts when status changes to OUT_FOR_DELIVERY.
2. Amazon SES: Emails customer official delivery receipt with POD photo link when DELIVERED.
"""
import os
from typing import Dict, Any, Optional
from ..utils.logger import get_logger
from ..utils.audit_logger import log_security_event

logger = get_logger("service.notification")


class NotificationService:
    def __init__(
        self,
        topic_arn: Optional[str] = None,
        region: Optional[str] = None,
        sender_email: Optional[str] = None,
    ):
        self.region = region or os.getenv("AWS_DEFAULT_REGION", "ap-northeast-2")
        self.topic_arn = topic_arn or os.getenv(
            "SNS_TOPIC_ARN",
            "arn:aws:sns:ap-northeast-2:761112473042:aerodispatch-customer-alerts",
        )
        self.sender_email = sender_email or os.getenv("SES_SENDER_EMAIL", "notifications@aerodispatch.site")

        self.sns_client = None
        self.ses_client = None

        try:
            import boto3
            self.sns_client = boto3.client("sns", region_name=self.region)
            self.ses_client = boto3.client("ses", region_name=self.region)
            logger.info("Initialized Amazon SNS and SES clients.")
        except Exception as e:
            logger.warning(f"Could not initialize SNS/SES clients: {e}. Using simulated messaging.")

    def _send_ses_email(
        self,
        recipient_email: str,
        subject: str,
        body_text: str,
        body_html: str,
    ) -> Dict[str, Any]:
        """Encapsulates sending transactional emails via Amazon SES with error recovery."""
        logger.info(f"Dispatching email to '{recipient_email}': {subject}")
        if self.ses_client and recipient_email:
            try:
                res = self.ses_client.send_email(
                    Source=self.sender_email,
                    Destination={"ToAddresses": [recipient_email]},
                    Message={
                        "Subject": {"Data": subject, "Charset": "UTF-8"},
                        "Body": {
                            "Text": {"Data": body_text, "Charset": "UTF-8"},
                            "Html": {"Data": body_html, "Charset": "UTF-8"},
                        },
                    },
                )
                message_id = res.get("MessageId")
                logger.info(f"SES Email sent successfully! MessageId: {message_id}")
                return {"status": "SENT", "channel": "AWS_SES", "messageId": message_id}
            except Exception as e:
                err_str = str(e)
                logger.warning(f"SES Email sending notice for '{recipient_email}': {err_str}")
                # Auto-dispatch verification if rejected due to Sandbox mode
                if "MessageRejected" in err_str and "not verified" in err_str:
                    try:
                        self.ses_client.verify_email_identity(EmailAddress=recipient_email)
                        logger.info(f"Auto-dispatched SES verification request to '{recipient_email}'")
                    except Exception as ver_err:
                        logger.warning(f"Could not auto-verify email '{recipient_email}': {ver_err}")

        return {
            "status": "SIMULATED",
            "channel": "LOCAL_MOCK",
            "recipient": recipient_email,
            "subject": subject,
        }

    def send_order_confirmation_email(
        self,
        recipient_email: str,
        order: Dict[str, Any],
    ) -> Dict[str, Any]:
        """
        Sends branded order creation confirmation email via Amazon SES with live tracking map link.
        """
        order_id = order.get("orderId") or order.get("awbNumber", "N/A")
        sender_info = order.get("sender") or {}
        recipient_info = order.get("recipient") or {}
        origin_city = sender_info.get("city") or order.get("senderCity", "Origin Hub")
        dest_city = recipient_info.get("city") or order.get("destinationCity", "Destination")
        service_tier = order.get("serviceTier", "AeroExpress Air")
        est_delivery = order.get("estimatedDelivery", "Within 24-48 Hours")
        tracking_url = f"https://aerodispatch.site/track?awb={order_id}"

        subject = f"Booking Confirmed: AeroDispatch Consignment {order_id}"
        body_text = (
            f"Hello,\n\n"
            f"Your consignment {order_id} has been registered successfully on AeroDispatch.\n\n"
            f"• Consignment AWB: {order_id}\n"
            f"• Route: {origin_city} ➔ {dest_city}\n"
            f"• Service Tier: {service_tier}\n"
            f"• Estimated Delivery: {est_delivery}\n\n"
            f"Track your package on the live interactive map:\n"
            f"{tracking_url}\n\n"
            f"Thank you for choosing AeroDispatch Serverless Logistics."
        )

        body_html = f"""
        <html>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #1e293b; background-color: #f8fafc; margin: 0; padding: 20px;">
            <div style="max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.06); border: 1px solid #e2e8f0;">
                <div style="background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); padding: 28px; text-align: center;">
                    <h1 style="color: #38bdf8; margin: 0; font-size: 24px; font-weight: 800; letter-spacing: -0.5px;">AeroDispatch</h1>
                    <p style="color: #94a3b8; margin: 6px 0 0 0; font-size: 14px;">Next-Gen Autonomous Air Logistics</p>
                </div>
                <div style="padding: 32px 24px;">
                    <h2 style="color: #0f172a; margin-top: 0; font-size: 18px;">Booking Confirmed!</h2>
                    <p style="color: #475569; font-size: 14px;">Your consignment has been recorded and scheduled for first-mile pickup manifest.</p>
                    
                    <div style="background: #f1f5f9; border-radius: 8px; padding: 16px; margin: 20px 0;">
                        <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
                            <tr><td style="padding: 6px 0; color: #64748b; font-weight: 500;">Air Waybill (AWB):</td><td style="font-family: monospace; font-weight: 700; color: #0284c7;">{order_id}</td></tr>
                            <tr><td style="padding: 6px 0; color: #64748b; font-weight: 500;">Route:</td><td style="font-weight: 600; color: #334155;">{origin_city} ➔ {dest_city}</td></tr>
                            <tr><td style="padding: 6px 0; color: #64748b; font-weight: 500;">Service Tier:</td><td style="color: #334155;">{service_tier}</td></tr>
                            <tr><td style="padding: 6px 0; color: #64748b; font-weight: 500;">Estimated Delivery:</td><td style="color: #334155;">{est_delivery}</td></tr>
                        </table>
                    </div>

                    <div style="text-align: center; margin: 30px 0;">
                        <a href="{tracking_url}" style="background: #ef4444; color: #ffffff; text-decoration: none; padding: 12px 28px; border-radius: 9999px; font-weight: 700; font-size: 14px; display: inline-block; box-shadow: 0 4px 14px rgba(239, 68, 68, 0.4);">
                            Track Consignment Live Map ➔
                        </a>
                    </div>
                    
                    <p style="color: #94a3b8; font-size: 12px; text-align: center; margin-top: 24px;">
                        Direct URL: <a href="{tracking_url}" style="color: #0284c7;">{tracking_url}</a>
                    </p>
                </div>
                <div style="background: #f8fafc; border-top: 1px solid #e2e8f0; padding: 16px; text-align: center; font-size: 12px; color: #94a3b8;">
                    AeroDispatch Serverless Logistics Network • Powered by AWS
                </div>
            </div>
        </body>
        </html>
        """
        return self._send_ses_email(recipient_email, subject, body_text, body_html)

    def send_sms(self, phone_number: str, message: str) -> Dict[str, Any]:
        """Sends an SMS text message using Amazon SNS."""
        logger.info(f"Dispatching SMS to '{phone_number}': {message}")
        if self.sns_client and phone_number:
            try:
                # Format phone number with E.164 standard if needed
                clean_phone = phone_number.strip().replace(" ", "")
                if not clean_phone.startswith("+"):
                    clean_phone = "+91" + clean_phone if len(clean_phone) == 10 else "+" + clean_phone

                res = self.sns_client.publish(
                    PhoneNumber=clean_phone,
                    Message=message,
                    MessageAttributes={
                        "AWS.SNS.SMS.SenderID": {
                            "DataType": "String",
                            "StringValue": "AERODISP",
                        },
                        "AWS.SNS.SMS.SMSType": {
                            "DataType": "String",
                            "StringValue": "Transactional",
                        },
                    },
                )
                message_id = res.get("MessageId")
                logger.info(f"SNS SMS sent successfully! MessageId: {message_id}")
                return {"status": "SENT", "channel": "AWS_SNS", "messageId": message_id}
            except Exception as e:
                logger.warning(f"SNS SMS delivery note (sandbox mode): {e}")

        # Simulated fallback for testing / sandbox accounts
        return {"status": "SIMULATED", "channel": "LOCAL_MOCK", "recipient": phone_number, "message": message}

    def notify_out_for_delivery(self, order: Dict[str, Any]) -> Dict[str, Any]:
        """Triggers OUT_FOR_DELIVERY SMS alert to receiver phone."""
        order_id = order.get("orderId", "N/A")
        driver_name = order.get("assignedDriverName", "Assigned Courier")
        phone = order.get("receiverPhone") or order.get("senderPhone") or "+919999999999"

        msg = (
            f"[AeroDispatch Alert] Your parcel {order_id} is OUT FOR DELIVERY with courier {driver_name}. "
            f"Expected delivery today. Track live: https://aerodispatch.io/track/{order_id}"
        )
        return self.send_sms(phone, msg)

    def send_delivery_receipt_email(
        self,
        recipient_email: str,
        order: Dict[str, Any],
        photo_url: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Sends branded delivery confirmation email via Amazon SES with Captain name and customer rating CTA.
        """
        order_id = order.get("orderId") or order.get("awbNumber", "N/A")
        dest_city = order.get("recipient", {}).get("city") or order.get("destinationCity", "Destination")
        delivered_at = order.get("deliveredAt") or order.get("updatedAt", "Just now")

        # Extract delivery captain info
        driver_info = order.get("assignedDriver") or {}
        captain_name = driver_info.get("name") or "AeroDispatch Delivery Captain"
        rating_url = f"https://aerodispatch.site/track?awb={order_id}&action=rate"

        subject = f"Delivered Safely: Your Consignment {order_id} by {captain_name}"
        body_text = (
            f"Hello,\n\n"
            f"Your consignment {order_id} has been delivered successfully to {dest_city} by {captain_name}.\n"
            f"Delivery Timestamp: {delivered_at}\n\n"
            f"How was your delivery experience? Rate Captain {captain_name} and leave feedback here:\n"
            f"{rating_url}\n\n"
            f"Thank you for choosing AeroDispatch Serverless Logistics."
        )

        body_html = f"""
        <html>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #1e293b; background-color: #f8fafc; margin: 0; padding: 20px;">
            <div style="max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.06); border: 1px solid #e2e8f0;">
                <div style="background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); padding: 28px; text-align: center;">
                    <h1 style="color: #38bdf8; margin: 0; font-size: 24px; font-weight: 800;">AeroDispatch</h1>
                    <p style="color: #10b981; margin: 6px 0 0 0; font-size: 14px; font-weight: 600;">✓ Delivered Safely</p>
                </div>
                <div style="padding: 32px 24px;">
                    <h2 style="color: #0f172a; margin-top: 0; font-size: 18px;">Your Package has Arrived!</h2>
                    <p style="color: #475569; font-size: 14px;">Your consignment <strong>{order_id}</strong> was delivered successfully.</p>
                    
                    <div style="background: #f1f5f9; border-radius: 8px; padding: 16px; margin: 20px 0;">
                        <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
                            <tr><td style="padding: 6px 0; color: #64748b;">Consignment AWB:</td><td style="font-weight: 700; color: #0284c7;">{order_id}</td></tr>
                            <tr><td style="padding: 6px 0; color: #64748b;">Delivered To:</td><td style="font-weight: 600;">{dest_city}</td></tr>
                            <tr><td style="padding: 6px 0; color: #64748b;">Delivered By:</td><td style="font-weight: 700; color: #0f172a;">{captain_name}</td></tr>
                            <tr><td style="padding: 6px 0; color: #64748b;">Status:</td><td><span style="background: #10b981; color: white; padding: 2px 8px; border-radius: 4px; font-weight: 700; font-size: 12px;">DELIVERED</span></td></tr>
                        </table>
                    </div>

                    {f'<p style="text-align: center; margin: 20px 0;"><a href="{photo_url}" style="color: #0284c7; font-weight: 600; text-decoration: none;">View Proof of Delivery Photo ➔</a></p>' if photo_url else ''}

                    <div style="background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 10px; padding: 20px; text-align: center; margin: 24px 0;">
                        <h3 style="margin: 0 0 6px 0; color: #1e3a8a; font-size: 16px;">How was Captain {captain_name}'s service?</h3>
                        <p style="margin: 0 0 16px 0; color: #3b82f6; font-size: 13px;">Help us recognize top performing captains with your rating!</p>
                        <a href="{rating_url}" style="background: #2563eb; color: #ffffff; text-decoration: none; padding: 10px 24px; border-radius: 9999px; font-weight: 700; font-size: 14px; display: inline-block; box-shadow: 0 4px 12px rgba(37, 99, 235, 0.3);">
                            Rate Captain {captain_name} ★★★★★
                        </a>
                    </div>
                </div>
                <div style="background: #f8fafc; border-top: 1px solid #e2e8f0; padding: 16px; text-align: center; font-size: 12px; color: #94a3b8;">
                    AeroDispatch Real-Time Serverless Logistics Platform on AWS
                </div>
            </div>
        </body>
        </html>
        """
        return self._send_ses_email(recipient_email, subject, body_text, body_html)

