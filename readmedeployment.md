# Deployment Guide for Todo List Application

## Overview
This document outlines the steps required to deploy the Todo List application to AWS EC2 with support for multiple MongoDB database providers (MongoDB, MongoDB Atlas, or AWS DocumentDB).

## Prerequisites
- AWS account with access to EC2 and DocumentDB (if using DocumentDB)
- Basic knowledge of AWS services
- MongoDB Atlas account (if using MongoDB Atlas)
- Node.js (v14+) and npm (v6+) installed locally
- Domain name (optional, for SSL setup)

## Step 1: Choose and Set Up Your Database

### Option A: Set Up AWS DocumentDB
1. Log in to the AWS Management Console
2. Navigate to the DocumentDB service
3. Create a new DocumentDB cluster
   - Choose an instance class (e.g., db.t3.medium)
   - Configure VPC and subnet settings
   - Set up security groups to allow access from your EC2 instance
4. Note the connection string, which will look like:
   ```
   mongodb://<username>:<password>@<cluster-endpoint>:27017/<database>?ssl=true&replicaSet=rs0&readPreference=secondaryPreferred&retryWrites=false
   ```

### Option B: Set Up MongoDB Atlas
1. Sign up or log in to MongoDB Atlas (https://www.mongodb.com/cloud/atlas)
2. Create a new cluster (M0 free tier is available)
3. Set up a database user with appropriate permissions
4. Whitelist IP addresses that will connect to the cluster
5. Get the connection string from the Connect dialog, which will look like:
   ```
   mongodb+srv://<username>:<password>@<cluster-name>.mongodb.net/<database>?retryWrites=true&w=majority
   ```

### Option C: Use Local or Self-Hosted MongoDB
1. Install MongoDB on your server
2. Configure MongoDB for network access
3. Secure your MongoDB installation with authentication
4. Note the connection string, which will look like:
   ```
   mongodb://<username>:<password>@<server-ip>:27017/<database>
   ```

## Step 2: Launch an EC2 Instance
1. Go to the EC2 service in the AWS Management Console
2. Launch a new instance:
   - Choose an Amazon Machine Image (AMI) - Amazon Linux 2 or Ubuntu are recommended
   - Select an instance type (t2.micro is eligible for free tier)
   - Configure instance details, including VPC settings
   - Add storage (8GB+ recommended)
   - Configure security groups to allow:
     - SSH (port 22)
     - HTTP (port 80)
     - HTTPS (port 443)
   - Create or select an existing key pair for SSH access
3. Connect to your instance using SSH
   ```bash
   ssh -i your-key.pem ec2-user@your-instance-public-ip
   ```

## Step 3: Prepare the Server Environment
1. Update the system packages
   ```bash
   # For Amazon Linux
   sudo yum update -y
   
   # For Ubuntu
   sudo apt update && sudo apt upgrade -y
   ```

2. Install Node.js and npm
   ```bash
   # For Amazon Linux
   curl -sL https://rpm.nodesource.com/setup_16.x | sudo bash -
   sudo yum install -y nodejs
   
   # For Ubuntu
   curl -sL https://deb.nodesource.com/setup_16.x | sudo -E bash -
   sudo apt install -y nodejs
   ```

3. Install Git
   ```bash
   # For Amazon Linux
   sudo yum install git -y
   
   # For Ubuntu
   sudo apt install git -y
   ```

4. Install PM2 for process management
   ```bash
   sudo npm install -g pm2
   ```

## Step 4: Deploy the Application
1. Clone the repository
   ```bash
   git clone https://github.com/yourusername/socbuddy.git
   cd socbuddy
   ```

2. Install dependencies
   ```bash
   npm install
   ```

3. Create an environment file (.env.local) with your database configuration
   ```bash
   cat > .env.local << EOF
   MONGODB_URI=your_mongodb_connection_string
   MONGODB_DB=your_database_name
   NEXTAUTH_SECRET=your_secure_random_string
   NEXTAUTH_URL=https://your-domain.com
   EOF
   ```

4. Build the application
   ```bash
   npm run build
   ```

5. Start the application with PM2
   ```bash
   pm2 start npm --name "socbuddy" -- start
   pm2 save
   pm2 startup
   ```

## Step 5: Set Up Nginx as a Reverse Proxy
1. Install Nginx
   ```bash
   # For Amazon Linux
   sudo amazon-linux-extras install nginx1
   
   # For Ubuntu
   sudo apt install nginx -y
   ```

2. Configure Nginx
   ```bash
   sudo nano /etc/nginx/conf.d/socbuddy.conf
   ```

   Add the following configuration:
   ```nginx
   server {
       listen 80;
       server_name your-domain.com www.your-domain.com;
       
       location / {
           proxy_pass http://localhost:3000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```

3. Test and restart Nginx
   ```bash
   sudo nginx -t
   sudo systemctl restart nginx
   ```

## Step 6: Set Up SSL with Let's Encrypt
1. Install Certbot
   ```bash
   # For Amazon Linux
   sudo amazon-linux-extras install epel
   sudo yum install certbot python-certbot-nginx -y
   
   # For Ubuntu
   sudo apt install certbot python3-certbot-nginx -y
   ```

2. Obtain and install certificates
   ```bash
   sudo certbot --nginx -d your-domain.com -d www.your-domain.com
   ```

3. Set up auto-renewal
   ```bash
   sudo systemctl status certbot.timer
   ```

## Step 7: Set Up Continuous Deployment with GitHub Actions

1. Create a GitHub Actions workflow file in your repository at `.github/workflows/deploy.yml`:

```yaml
name: Deploy to EC2

on:
  push:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v2
    
    - name: Set up SSH
      uses: webfactory/ssh-agent@v0.5.3
      with:
        ssh-private-key: ${{ secrets.SSH_PRIVATE_KEY }}
        
    - name: Add host key
      run: |
        mkdir -p ~/.ssh
        echo "${{ secrets.KNOWN_HOSTS }}" >> ~/.ssh/known_hosts
        
    - name: Deploy to EC2
      run: |
        ssh ${{ secrets.SSH_USER }}@${{ secrets.SSH_HOST }} "cd ~/socbuddy && git pull && npm install && npm run build && pm2 restart socbuddy"
```

2. Add the following secrets to your GitHub repository:
   - `SSH_PRIVATE_KEY`: Your EC2 instance private key
   - `KNOWN_HOSTS`: Output of `ssh-keyscan your-ec2-ip`
   - `SSH_USER`: Username for SSH (e.g., ec2-user)
   - `SSH_HOST`: Your EC2 instance public IP or hostname

## Monitoring and Maintenance

### Application Monitoring
1. Use PM2 for basic monitoring
   ```bash
   pm2 status
   pm2 logs
   ```

2. Set up CloudWatch for more comprehensive monitoring
   ```bash
   sudo amazon-linux-extras install -y collectd
   sudo yum install -y awslogs
   sudo systemctl start awslogsd
   sudo systemctl enable awslogsd
   ```

### Database Monitoring
- For DocumentDB: Use AWS CloudWatch metrics
- For MongoDB Atlas: Use Atlas monitoring tools
- For self-hosted MongoDB: Set up MongoDB monitoring tools

## Security Considerations
1. Use IAM roles for EC2 instances
2. Regularly update packages
3. Use a firewall to restrict access
4. Implement rate limiting
5. Consider using AWS WAF for additional protection
6. Enable database access from specific IP addresses only

## Performance Optimization
1. Use a CDN for static assets
2. Optimize images and assets
3. Implement MongoDB indexing for frequently queried fields
4. Consider using caching (Redis, Memcached)
5. Monitor and optimize Node.js memory usage

## Troubleshooting
1. Check application logs
   ```bash
   pm2 logs socbuddy
   ```

2. Check Nginx logs
   ```bash
   sudo tail -f /var/log/nginx/error.log
   sudo tail -f /var/log/nginx/access.log
   ```

3. Test database connectivity
   ```bash
   node -e "const mongoose = require('mongoose'); mongoose.connect('YOUR_MONGODB_URI').then(() => console.log('Connected')).catch(err => console.error(err))"
   ```

4. Verify that your security groups allow traffic on the necessary ports

## Database Compatibility Notes

The application has been updated to support multiple MongoDB providers:

1. **MongoDB**: Standard MongoDB installation
2. **MongoDB Atlas**: Cloud-hosted MongoDB service
3. **AWS DocumentDB**: Amazon's MongoDB-compatible database service

The connection details and database provider can be viewed in the admin panel's Database Info tab.

### Special Considerations for DocumentDB

When using AWS DocumentDB, additional connection options are applied automatically:
- SSL is enabled
- `retryWrites` is set to false
- If `DOCDB_TLS_CERT_PATH` environment variable is set, the TLS CA file is specified

If you encounter TLS/SSL issues with DocumentDB, you may need to download the CA certificate:
```bash
wget https://truststore.pki.rds.amazonaws.com/global/global-bundle.pem -O rds-combined-ca-bundle.pem
```

Then set the environment variable:
```
DOCDB_TLS_CERT_PATH=/path/to/rds-combined-ca-bundle.pem
```

## Conclusion

This deployment guide covers the essentials for deploying the Todo List application to AWS EC2 with support for multiple MongoDB providers. For specific issues or advanced configurations, consult the AWS documentation or reach out to your systems administrator. 