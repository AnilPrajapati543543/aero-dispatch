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
        self.sender_email = sender_email or os.getenv("SES_SENDER_EMAIL", "notifications@aerodispatch.io")

        self.sns_client = None
        self.ses_client = None

        try:
            import boto3
            self.sns_client = boto3.client("sns", region_name=self.region)
            self.ses_client = boto3.client("ses", region_name=self.region)
            logger.info("Initialized Amazon SNS and SES clients.")
        except Exception as e:
            logger.warning(f"Could not initialize SNS/SES clients: {e}. Using simulated messaging.")

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
        Sends branded delivery receipt email via Amazon SES with POD photo link.
        """
        order_id = order.get("orderId", "N/A")
        dest_city = order.get("destinationCity", "Destination")
        delivered_at = order.get("deliveredAt") or order.get("updatedAt", "Just now")

        subject = f"Delivered: Your AeroDispatch Parcel {order_id} has arrived!"
        body_text = (
            f"Hello,\n\n"
            f"Your consignment {order_id} has been successfully delivered to {dest_city}.\n"
            f"Delivery Timestamp: {delivered_at}\n"
            f"Proof of Delivery Photo: {photo_url or 'Verified on system'}\n\n"
            f"Thank you for choosing AeroDispatch Serverless Logistics."
        )

        body_html = f"""
        <html>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
            <div style="background-color: #0b1120; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
                <h1 style="color: #38bdf8; margin: 0;">AeroDispatch Delivery Confirmation</h1>
            </div>
            <div style="padding: 24px; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 8px 8px;">
                <p>Hello,</p>
                <p>Your package <strong>{order_id}</strong> was delivered successfully.</p>
                <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
                    <tr><td style="padding: 8px 0; color: #64748b;">Consignment AWB:</td><td><strong>{order_id}</strong></td></tr>
                    <tr><td style="padding: 8px 0; color: #64748b;">Delivered To:</td><td><strong>{dest_city}</strong></td></tr>
                    <tr><td style="padding: 8px 0; color: #64748b;">Status:</td><td><span style="background: #10b981; color: white; padding: 3px 8px; border-radius: 4px;">DELIVERED</span></td></tr>
                </table>
                {f'<p><strong>Proof of Delivery Photo:</strong><br><a href="{photo_url}" style="color: #0284c7;">View Verified Delivery Photo</a></p>' if photo_url else ''}
                <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;">
                <p style="font-size: 12px; color: #94a3b8;">AeroDispatch Real-Time Serverless Logistics Platform on AWS</p>
            </div>
        </body>
        </html>
        """

        logger.info(f"Sending delivery receipt email to '{recipient_email}' for {order_id}")
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
                logger.warning(f"SES Email delivery note (sandbox mode): {e}")

        return {
            "status": "SIMULATED",
            "channel": "LOCAL_MOCK",
            "recipient": recipient_email,
            "subject": subject,
        }

