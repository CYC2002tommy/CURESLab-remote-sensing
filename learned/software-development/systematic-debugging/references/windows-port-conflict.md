# Windows Port Conflict Resolution

When encountering `[Errno 10048] error while attempting to bind on address` or similar "Address already in use" errors on Windows, POSIX tools like `lsof -i` or `kill -9` will not work.

Instead, use the following sequence in the terminal (specifically designed to work under MSYS/Git-Bash without path-translation errors):

1. **Find the process listening on the port:**
   ```bash
   netstat -ano | grep <port_number>
   ```
   *Look for the line with state `LISTENING` and note the PID in the final column.*

2. **Kill the process by PID:**
   ```bash
   taskkill //PID <pid> //F
   ```
   *Note: In MSYS/Git-Bash terminals, you MUST use `//PID` and `//F` (double slashes). Single slashes (`/PID`, `/F`) get translated by the shell into POSIX paths before reaching the Windows `taskkill.exe`, causing "invalid argument" errors.*

**Example:**
```bash
$ netstat -ano | grep 9119
  TCP    127.0.0.1:9119         0.0.0.0:0              LISTENING       17824
$ taskkill //PID 17824 //F
SUCCESS: The process with PID 17824 has been terminated.
```