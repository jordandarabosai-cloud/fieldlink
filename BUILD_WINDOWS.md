# Build FieldLink for Windows

## 1) Prerequisites

Install Node.js 20+ (LTS recommended).

In PowerShell:

```powershell
node -v
npm -v
```

## 2) Install dependencies

```powershell
cd "$HOME\Documents\fieldlink\desktop"
npm install
```

## 3) Build a runnable Windows app (.exe in folder)

```powershell
npm run dist:win
```

Output location:

```text
desktop\release\FieldLink-win32-x64\FieldLink.exe
```

This is the fastest/reliable route and does not require installer signing setup.

## 4) Optional: Build an installer (.exe setup wizard)

```powershell
npm run dist:win:installer
```

Output location (if successful):

```text
desktop\release\FieldLink Setup <version>.exe
```

If installer build fails with symlink privilege errors, either:
- Run PowerShell as Administrator, or
- Enable **Developer Mode** in Windows settings and retry.
