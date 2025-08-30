# WatchLess - Google Cloud Run Deployment Guide

This guide walks you through deploying the WatchLess timer application to Google Cloud Run using Cloud Build for CI/CD.

## Prerequisites

- Google Cloud Project created
- GitHub repository connected
- `gcloud` CLI installed and authenticated (optional)

## 1. Enable Required APIs

Go to **APIs & Services → Library** and enable the following APIs:

- ✅ **Cloud Build API**
- ✅ **Cloud Run API**
- ✅ **Container Registry API**
- ✅ **Google Sheets API** (for session tracking functionality)

Alternatively, use the CLI:

```bash
gcloud services enable cloudbuild.googleapis.com
gcloud services enable run.googleapis.com
gcloud services enable containerregistry.googleapis.com
gcloud services enable sheets.googleapis.com
```

## 2. Create Service Account for Google Sheets Access

1. Navigate to **IAM & Admin → Service Accounts**
2. Click **Create Service Account**
3. Configure the service account:
   - **Name**: `watchless-sheets-access`
   - **Description**: `Service account for WatchLess Google Sheets integration`
4. Grant permissions:
   - **Role**: `Editor` (or create a custom role with Google Sheets API access)
5. Click **Create and Continue**
6. Click **Create Key** → **JSON**
7. Download the JSON key file
8. **⚠️ Important**: Do not commit this file to your repository

## 3. Set up Secret Manager (Recommended)

Go to **Security → Secret Manager** and create the following secrets:

### Create Secrets

1. **`google-sheets-spreadsheet-id`**
   - Value: Your Google Sheets spreadsheet ID
   - Example: `1DLhsYv2YBgth7wQI2i37sX0QvmEj3ig9LMeMRryioyY`

2. **`google-service-account-key`**
   - Upload the JSON file you downloaded in step 2

3. **`vapid-public-key`** (if using push notifications)
   - Value: Your VAPID public key

4. **`vapid-private-key`** (if using push notifications)
   - Value: Your VAPID private key

## 4. Configure Cloud Build Trigger

1. Go to **Cloud Build → Triggers**
2. Click **Create Trigger**
3. Configure the trigger:

   **Basic Settings:**
   - **Name**: `watchless-deploy`
   - **Description**: `Deploy WatchLess app to Cloud Run`
   - **Event**: `Push to a branch`

   **Source:**
   - **Repository**: Connect your GitHub repository
   - **Branch**: `^feature-optimized-build$` (or `^main$` for production)

   **Configuration:**
   - **Type**: `Cloud Build configuration file (yaml or json)`
   - **Cloud Build configuration file location**: `cloudbuild.yaml`

4. Click **Create**

## 5. Configure Cloud Run Service (After First Deployment)

After your first successful deployment:

1. Go to **Cloud Run → Services**
2. Click on your `watchless` service
3. Click **Edit & Deploy New Revision**
4. Configure the following:

   **Security Tab:**
   - **Service Account**: Select `watchless-sheets-access@your-project.iam.gserviceaccount.com`

   **Variables & Secrets Tab (Optional):**
   - Add environment variables:

     ```env
     GOOGLE_SHEETS_SPREADSHEET_ID = your_spreadsheet_id
     NODE_ENV = production
     ```

   **Connections Tab:**
   - **CPU allocation**: `CPU is only allocated during request processing`
   - **Minimum instances**: `0` (scales to zero when not in use)
   - **Maximum instances**: `10`

5. Click **Deploy**

## 6. Test Your Deployment

1. **Trigger Build**: Push changes to your configured branch
2. **Monitor Build**: Go to **Cloud Build → History** to watch the build progress
3. **Access Application**: Once deployed, your app will be available at:

   ```url
   https://watchless-[hash]-uc.a.run.app
   ```
4. **Test Health Check**: Visit `/health` endpoint to verify the service is running

## 7. Configure Custom Domain (Optional)

1. Go to **Cloud Run → Domain Mappings**
2. Click **Add Mapping**
3. Select your service and enter your custom domain
4. Follow DNS configuration instructions

## Troubleshooting

### Common Issues

**Build Fails:**

- Check **Cloud Build → History** for detailed logs
- Verify all required APIs are enabled
- Check Docker syntax in `Dockerfile`


**Google Sheets Access Denied:**

- Ensure service account has proper permissions
- Verify the spreadsheet ID is correct
- Check that the service account email has access to your Google Sheet


**Health Check Fails:**

- Verify `/health` endpoint returns 200 status
- Check that the app is listening on the correct PORT

**503 Service Unavailable:**

- Check Cloud Run logs for startup errors
- Verify container is exposing port 8080
- Check memory and CPU limits

### Build Time Optimization

Expected build times:

- **First build**: 8-12 minutes (no cache)
- **Subsequent builds**: 4-8 minutes (with Docker layer caching)

## Monitoring and Logs

- **Application Logs**: Cloud Run → Services → watchless → Logs
- **Build Logs**: Cloud Build → History → [Build ID]
- **Metrics**: Cloud Run → Services → watchless → Metrics

## Security Best Practices

1. ✅ Use Secret Manager for sensitive data
2. ✅ Enable IAM authentication for production
3. ✅ Regularly rotate service account keys
4. ✅ Use least-privilege IAM roles
5. ✅ Monitor access logs

## Cost Optimization

- **Scaling**: Service scales to zero when not in use
- **CPU allocation**: Only during request processing
- **Memory**: Optimized at 512Mi for this application
- **Estimated cost**: $0-5/month for low-moderate traffic

---

## Support

If you encounter issues:

1. Check the [troubleshooting section](#troubleshooting) above
2. Review Cloud Build and Cloud Run logs
3. Consult the [Google Cloud Run documentation](https://cloud.google.com/run/docs)
