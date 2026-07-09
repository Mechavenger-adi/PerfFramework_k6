# Prerequisites & Setup Guide

This guide covers the necessary tools and environment setup required to use the k6 Performance Framework.

## 1. Install Node.js
The framework's core engine, CLI, and configuration processes run on Node.js.

- **Requirement**: Node.js Version 22 or higher.
- **Installation**:
  - **Windows / macOS**: Download the installer from the [official Node.js website](https://nodejs.org/).
  - **Linux**: Use a package manager like `nvm` (Node Version Manager) or `apt/yum`.
  ```bash
  # Example using nvm
  nvm install 22
  nvm use 22
  ```
- **Verification**:
  ```bash
  node --version
  ```

## 2. Install npm
npm (Node Package Manager) is included with Node.js. It is used to install project dependencies and run framework CLI commands.

- **Requirement**: npm Version 11 or higher.
- **Verification**:
  ```bash
  npm --version
  ```
*(If you need to update npm, run: `npm install -g npm@latest`)*

## 3. Install TypeScript (Optional Globally)
The framework is written in TypeScript, but local dependencies handle compilation and execution. You do not strictly need it globally, but knowing basic TypeScript is highly recommended for writing journey scripts.

- **Verification** (if installed globally):
  ```bash
  tsc --version
  ```

## 4. Install k6
k6 is the underlying load testing tool that actually executes the traffic generation. It must be installed natively on your OS and available in your system's `PATH`.

- **Requirement**: The latest version of Grafana k6.
- **Installation**:
  - **Windows** (using Chocolatey or Winget):
    ```bash
    winget install k6
    # OR
    choco install k6
    ```
  - **macOS** (using Homebrew):
    ```bash
    brew install k6
    ```
  - **Linux** (Debian/Ubuntu):
    ```bash
    sudo gpg -k
    sudo gpg --no-default-keyring --keyring /usr/share/keyrings/k6-archive-keyring.gpg --keyserver hkp://keyserver.ubuntu.com:80 --recv-keys C5AD17C747E3415A3642D57D77C6C491D6AC1D69
    echo "deb [signed-by=/usr/share/keyrings/k6-archive-keyring.gpg] https://dl.k6.io/deb stable main" | sudo tee /etc/apt/sources.list.d/k6.list
    sudo apt-get update
    sudo apt-get install k6
    ```
- **Verification**:
  ```bash
  k6 version
  ```

## 5. Framework Installation
Once the above components are installed, you can clone and set up the framework:

```bash
git clone https://github.com/<your-org>/K6-PerfFramework.git
cd K6-PerfFramework
npm install
```

You're now ready to use the framework CLI! Use `npm run cli -- --help` to explore commands.
