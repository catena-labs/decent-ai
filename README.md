<img src="./assets/images/icon.png" align="right" width="120" height="120" />

# decent-ai

> [!NOTE]
> Decent AI is no longer being offered in the App Store and Play Store. The code for the mobile client is is now open source, but the project is no longer maintained.

## Installation

First, run the setup script to install all dependencies and create a local `.env.local` file:

```sh
bun run setup
```

This will create a `.env.local` file which you can use to set your local configuration. It is initialized using your Local IP address for the API server.

This app is built using [Expo](https://expo.dev/). If you have any trouble, pleaes refer to the quality [Expo documentation](https://docs.expo.dev/) which may help answer any issues.

## XCode setup

To run the iOS simulator, you will need to download and install [Xcode](https://apps.apple.com/us/app/xcode/id497799835). During setup, make sure that you download the iOS platform to be able to run the iOS simulator.

Once it's installed, you should navigate to **Settings > Accounts** and log into your developer account. This account should have been added to the Catena development team.

### Xcode Signing Certificates

In order to run the app locally, you'll need to set up signing certifcates, which Apple uses to track all software downloaded on iOS devices. To do so follow the instructions [here](https://github.com/expo/fyi/blob/main/setup-xcode-signing.md).

## Android setup

### Recommended setup

Follow the [recommended steps from Expo](https://docs.expo.dev/workflow/android-studio-emulator/#install-dependencies)

### Manual setup

For Android builds, download and install [Android Studio](https://developer.android.com/studio).

This build expects OpenJDK, not the official Oracle JDK. The Oracle JDK has known build issues. Set your `JAVA_HOME` to the OpenJDK in Android Studio:

```
export JAVA_HOME=/Applications/Android\ Studio.app/Contents/jbr/Contents/Home
```

In addition, set your `ANDROID_HOME`:

```
export ANDROID_HOME=~/Library/Android/sdk
```

To install on an Android device, enable Developer Options. You can do this on your device by navigating to **Settings > About phone** and then scrolling down to 'Build number' and tapping 7 times on the build number listed.

## Running the app

Please note: the API for Decent AI has not been open sourced and is required to use the mobile app.

The recommended way to run the app is to run either of the following commands:

```sh
bun ios
```

or

```sh
bun android
```

These will build the app (one time only) and launch the simulators for the respective projects. All code will be live updated as you develop.

### Running on device

If you'd like to run this natively on your device you can run:

```sh
bun expo prebuild
```

Then you can run:

```sh
bun ios
# or
bun android
```

> NOTE: For iOS devices, you may need to register your device with Apple and set up a provisioning profile.

## Local IP Address

Because this app runs on mobile devices and simulators, you can not connect to the local API via `localhost`. To get around this you must set the host to your local IP address.

To help with this, the `bun run setup` script will automatically set the `EXPO_PUBLIC_API_URL` variable in your `.env.local` file to use your local IP address.

If you change networks (e.g. office vs home), you can quickly switch to your new IP address by running:

```sh
./bin/ip
```

This will automatically set the `EXPO_PUBLIC_API_URL` variable in your `.env.local` file to your local IP address.

### Manually setting your local IP address

To manually find your local IP address, you can run:

```sh
ipconfig getifaddr en0
```

Then set the `EXPO_PUBLIC_API_URL` variable in your `.env.local` file to your local IP address and the API port (default is `3000`). Be sure to use `http`, not `https`.

An example .env.local file might look like:

```sh
EXPO_PUBLIC_API_URL="http://192.168.7.194:3000"
```

## Linting / Checking the codebase

To run a full check of the codebase (typecheck, lint, prettier check, test), run:

```sh
bun run check
```

### Linting

```sh
bun run lint
```

### Type Checking

```sh
bun run typecheck
```

### Formatting with Prettier

```sh
bun run format
```

to check for format errors, run:

```sh
bun run format:check
```

### Testing

```sh
bun run test
```

---

## By Catena Labs

This project was created and open sourced by [Catena Labs](https://catena.xyz).
