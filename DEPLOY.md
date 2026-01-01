# Deployment Guide

This guide explains how to deploy SignalSculptor to an Ubuntu VPS using Docker.

## Prerequisites

1.  **Ubuntu VPS**: A server running Ubuntu (e.g., DigitalOcean Droplet).
2.  **Docker**: Installed on the VPS.
    - If not installed, run:
      ```bash
      apt update
      apt install -y docker.io
      systemctl start docker
      systemctl enable docker
      ```

## Local Testing
Before deploying, you can run the container on your own machine.

1.  **Start Docker**: Ensure Docker Desktop is running.
2.  **Build**:
    ```bash
    docker build -t signalsculptor .
    ```
3.  **Run**:
    ```bash
    docker run -d --name signal-sculptor -p 8080:80 signalsculptor
    ```
4.  **Visit**: Open `http://localhost:8080` in your browser.

## Deployment Steps

### 1. Transfer Files
Copy the project files to your VPS. You can use Git or `scp`.

**Method A: Git (Recommended)**
```bash
# On your VPS
git clone <your-repo-url>
cd SignalSculptor
```

**Method B: SCP (Copy local files)**
```bash
# On your local machine
scp -r . root@your-vps-ip:~/signal-sculptor
```

### 2. Build the Docker Image
Navigate to the project directory on your VPS and run:

```bash
docker build -t signalsculptor .
```

### 3. Run the Container
Start the container, mapping port 80 of the VPS to port 80 of the container.

```bash
docker run -d --name signal-sculptor -p 80:80 signalsculptor
```

### 4. Verification
Open your browser and visit `http://<your-vps-ip>`. You should see the SignalSculptor application.

## Troubleshooting

- **Check logs**: `docker logs signal-sculptor`
- **Stop container**: `docker stop signal-sculptor`
- **Remove container**: `docker rm signal-sculptor`
- **Rebuild**: After code changes, run the build command again and restart the container.
