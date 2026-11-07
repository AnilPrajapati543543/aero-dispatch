# AeroDispatch AWS Deployment Guide (Seoul Region - ap-northeast-2)

This guide walks you through deploying **AeroDispatch** to AWS using the **Free Tier** with your custom domain.

---

## 📦 Ready-Made Deployment Packages
We have prepared optimized production packages in your project root:
1. **Backend Package**: [`aerodispatch-backend-v1.zip`](./aerodispatch-backend-v1.zip) (53 KB)
   - Pre-configured with `Procfile`, `application.py`, production `requirements.txt`, and Nginx WebSocket proxy configuration.
2. **Frontend Build**: [`aerodispatch-frontend-dist.zip`](./aerodispatch-frontend-dist.zip) (389 KB) or [`frontend/dist`](./frontend/dist/)
   - Fully compiled and minified Vite/React SPA ready for S3 / CloudFront / Vercel.

---

## 🚀 Step 1: Configure AWS CLI (If Deploying via Terminal)

Open PowerShell and run:
```powershell
aws configure
```
Enter your details:
- **AWS Access Key ID**: `[Your Access Key]`
- **AWS Secret Access Key**: `[Your Secret Access Key]`
- **Default region name**: `ap-northeast-2`
- **Default output format**: `json`

Verify your connection:
```powershell
aws sts get-caller-identity
```

---

## ⚡ Step 2: Deploy Backend to AWS Elastic Beanstalk (Free Tier)

Elastic Beanstalk provisions a dedicated, free `t3.micro` / `t2.micro` EC2 instance running Python, Nginx, and Uvicorn. It runs **24/7 with zero sleeping/cold starts**.

### Method A: Via AWS Management Console (Recommended, 3 Clicks)
1. Open the **[AWS Elastic Beanstalk Console](https://ap-northeast-2.console.aws.amazon.com/elasticbeanstalk/home?region=ap-northeast-2)**.
2. Ensure your top-right region is set to **Asia Pacific (Seoul) `ap-northeast-2`**.
3. Click **"Create application"**:
   - **Application name**: `AeroDispatch`
   - **Platform**: `Python`
   - **Platform branch**: `Python 3.11 running on 64bit Amazon Linux 2023` (or Python 3.12)
   - **Application code**: Choose **"Upload your code"**
   - **Version label**: `v1.0.0`
   - **Source code origin**: Select **"Local file"** -> Click **"Choose file"** and select:
     `c:\Users\micro\OneDrive\Desktop\scratch\aero-dispatch\aerodispatch-backend-v1.zip`
   - **Configuration presets**: Select **"Single instance (free tier eligible)"**
4. Click **Next** -> Follow the prompts (use default service role) -> Click **Submit**.
5. In ~4 minutes, Beanstalk will turn **Green (OK)** and give you a public URL (e.g., `http://aerodispatch-env.ap-northeast-2.elasticbeanstalk.com`).

---

## 🌐 Step 3: Deploy Frontend to S3 + CloudFront (or Cloudflare/Vercel)

### Option A: AWS S3 + CloudFront (100% Inside AWS)
1. Open the **[Amazon S3 Console](https://s3.console.aws.amazon.com/s3/)** in Seoul (`ap-northeast-2`).
2. Create an S3 Bucket named `aerodispatch-frontend-761112473042`:
   - Enable "Static website hosting" (Index: `index.html`, Error: `index.html`).
   - Upload all files from `aero-dispatch/frontend/dist/` into the bucket.
3. Open **[Amazon CloudFront Console](https://us-east-1.console.aws.amazon.com/cloudfront/v4/home)**:
   - Click **Create Distribution**.
   - Origin domain: Select your S3 bucket.
   - Viewer protocol policy: **Redirect HTTP to HTTPS**.
   - Alternate domain name (CNAME): `yourdomain.com` (and `www.yourdomain.com`).
   - Custom SSL Certificate: Request a free certificate in **ACM (us-east-1)**.
   - Under **Error pages**: Create a Custom Error Response for `404` and `403` -> Response page path `/index.html`, HTTP response code `200` (required for Single Page Apps).

### Option B: Cloudflare Pages / Vercel (1-Click Free Hosting)
1. Connect your GitHub repository.
2. Set Root Directory to `frontend`.
3. Set Environment Variable: `VITE_API_BASE_URL` = `https://api.yourdomain.com` (or your Beanstalk URL).
4. Connect `yourdomain.com` with automatic free SSL.

---

## 🔗 Step 4: Connecting Your Custom Domain

In your DNS manager (Cloudflare or Route 53):

| Type | Name | Target | Purpose |
| :--- | :--- | :--- | :--- |
| **CNAME** / **A (ALIAS)** | `@` (or `yourdomain.com`) | `your-cloudfront-id.cloudfront.net` | Frontend React UI |
| **CNAME** | `www` | `yourdomain.com` | Redirect to main domain |
| **CNAME** | `api` | `aerodispatch-env.ap-northeast-2.elasticbeanstalk.com` | Backend FastAPI + WebSockets |

---

## 🎯 Step 5: AWS Smart Logistics Resources Checklist

Run these in PowerShell to ensure all smart AWS services exist in your Seoul region:

```powershell
# 1. S3 Proof of Delivery Photos Bucket
aws s3 mb s3://aerodispatch-proofs-761112473042 --region ap-northeast-2

# 2. Amazon Location Service (Geocoding & Place Search)
aws location create-place-index --index-name "AeroDispatch-PlaceIndex-Seoul" --data-source "Esri" --region ap-northeast-2

# 3. Amazon Location Service (Route Calculator)
aws location create-route-calculator --calculator-name "AeroDispatch-RouteCalc-Seoul" --data-source "Esri" --region ap-northeast-2

# 4. Amazon Location Service (Geofencing 500m)
aws location create-geofence-collection --collection-name "AeroDispatch-Geofence-Seoul" --region ap-northeast-2
```

