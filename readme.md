# Node DDNS Cloudflare

This is a Node.js app that can help with the following scenario:
- You have a computer connected to a UPnP-compatible router that gets dynamic IP from the ISP. Most consumer routers are UPnP-compatible.
- You have a domain that you manage using Cloudflare.
- You want that domain (or a sub domain) to be kept up-to-date with the router's current external IPv4 address and/or the computer's current global IPv6 address.

I run this app on a Windows 11 computer behind an ASUS GT-BE98 router, but in theory this should be cross-platform and work with any UPnP-compatible router.


## Prerequisites
You probably need Node.js 22 or newer installed on the computer that is going to run this app.


## Usage
Open the project folder in a command line window and type:
```sh
npm start
```

Alternatively, on Windows, you can run the helper script called win-start-hidden.vbs. It will run the app in the background using a completely hidden console window.

You can also perform a dry-run by typing "npm run dry" or "node . dry" in a command line window in the project folder.
A dry run means the app will not make any modifications to DNS records.

You can terminate the app by deleting the file called app-pid.txt that it creates in the project folder when it starts running. The app will terminate itself whenever the content of this file is changed or if the file is deleted or renamed, effectively ensuring that only one instance of the app will run at any given time.

It is also possible to give a name to an app instance in order to have different instances with different configs running simultaneously. For example, the following command will prefix filenames of config, pid, and log files with the word home:
```sh
node . name=home
```

Or to do a dry-run with a specific instance name:
```sh
node . dry name=home
```

The helper script win-start-hidden.vbs can also forward these same arguments, like this:
```sh
win-start-hidden.vbs name=home
```


## Configuration
If there is no app-config.json file in the project folder, then one will be created when you run the app.

Open it in an editor and set the following required values:
- domain (string): This is the full domain name that you wish to use, such as home.example.com
- apiToken (string): This is an API token from Cloudflare that must have DNS:Read and DNS:Edit permissions on the domain.
- zoneID (string): This is the zone ID for the domain in Cloudflare.

The config file also has some optional settings:
- updateIPv4 (boolean): When set to true, the app will keep the type A record of the domain name up-to-date with the router's external IPv4 address.
- updateIPv6 (boolean): When set to true, the app will keep the type AAAA record of the domain name up-to-date with the computer's global IPv6 address.
- interfaceName (string): This is the name of the network interface that you wish to use. It must match exactly, and it is case-sensitive. Use an empty string here if you want the app to try to find a suitable interface automatically.
- ttl (number): This is the TTL value (in seconds) that will be used when updating DNS records.
- proxied (boolean): When set to true, it will instruct Cloudflare to hide the IP behind its proxy feature.
- minPollRateMS (number): This is the minimum time (in milliseconds) that the app should sleep between each time it checks to see if the IP address has changed.
- showDebugMessages (boolean): When set to true, the app will show debug messages in the console window.
