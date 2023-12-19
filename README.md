# Recruitment Exercise

This solution is crafted to smoothly operate within the Google Cloud environment.

## Run Locally

To run the application on your local machine, make sure to set the required environment variables.

Once you've provided the necessary environment variables, go to the application folder, install the required dependencies, build the project and run the application.

```bash
npm install
npm run build
npm run dev
```

## Run on Cloud

For cloud deployment, drop a Service Account JSON file named `keys.json` into the project root directory. The Service Account should be given the following permissions: `BigQuery Admin`, `Cloud Functions Admin`, `Service Account User`, `Storage Admin`.

Navigate into the terraform directory, trigger off Terraform's initialization, and apply the configuration files.

```
cd terraform
terraform init
terraform apply
```

The production URL will be displayed as output in the console.
