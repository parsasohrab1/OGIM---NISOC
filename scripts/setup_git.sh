#!/bin/bash
# Git setup script for OGIM project

echo "======================================"
echo "OGIM Git Setup"
echo "======================================"

# Check if git is installed
if ! command -v git &> /dev/null; then
    echo "Error: Git is not installed"
    echo "Please install Git from https://git-scm.com/"
    exit 1
fi

# Initialize git repository if not already initialized
if [ ! -d ".git" ]; then
    echo "Initializing git repository..."
    git init
    git branch -M main
fi

# Check if user name and email are configured
if [ -z "$(git config user.name)" ] || [ -z "$(git config user.email)" ]; then
    echo ""
    echo "Git user configuration is missing!"
    echo "Please run:"
    echo "  git config --global user.name 'Your Name'"
    echo "  git config --global user.email 'your.email@example.com'"
    echo ""
    read -p "Do you want to configure now? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        read -p "Enter your name: " name
        read -p "Enter your email: " email
        git config --global user.name "$name"
        git config --global user.email "$email"
        echo "Git configuration updated!"
    fi
fi

# Show current git status
echo ""
echo "Current Git Configuration:"
echo "  User: $(git config user.name)"
echo "  Email: $(git config user.email)"
echo "  Branch: $(git branch --show-current)"
echo ""

# Show remote if configured
if git remote | grep -q "origin"; then
    echo "Remote Repository:"
    git remote -v
else
    echo "No remote repository configured."
    echo "To add a remote repository:"
    echo "  git remote add origin <repository-url>"
fi

echo ""
echo "======================================"
echo "Git setup complete!"
echo "======================================"

