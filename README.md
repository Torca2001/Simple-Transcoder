<h1 align="center">
  Simple-Transcoder
</h1>

<div align="center">
  Simple video transcoder for sharing clips
  <br />
  <br />
  <a href="https://github.com/Torca2001/Simple-Transcoder/issues/new?assignees=&labels=bug&template=01_BUG_REPORT.md&title=bug%3A+">Report a Bug</a>
  ·
  <a href="https://github.com/Torca2001/Simple-Transcoder/issues/new?assignees=&labels=enhancement&template=02_FEATURE_REQUEST.md&title=feat%3A+">Request a Feature</a>
  .
  <a href="https://github.com/Torca2001/Simple-Transcoder/issues/new?assignees=&labels=question&template=04_SUPPORT_QUESTION.md&title=support%3A+">Ask a Question</a>
</div>

<div align="center">
<br />

[![GitHub](https://img.shields.io/github/license/Torca2001/Simple-Transcoder?style=flat-square)](LICENSE)

[![Pull Requests welcome](https://img.shields.io/badge/PRs-welcome-ff69b4.svg?style=flat-square)](https://github.com/Torca2001/Simple-Transcoder/issues?q=is%3Aissue+is%3Aopen+label%3A%22help+wanted%22)
[![coded by Torca](https://img.shields.io/badge/%3C%2F%3E%20with%20%E2%99%A5%20by-Torca2001-ff1414.svg?style=flat-square&colorB=yellow)](https://github.com/Torca2001)
[![Electron](https://img.shields.io/badge/dynamic/json.svg?url=https%3A%2F%2Fraw.githubusercontent.com%2FTorca2001%2FSimple-Transcoder%2Fmaster%2Fpackage.json&label=Electron&query=$.devDependencies.electron&colorB=green)](https://github.com/electron/electron)

</div>

<details open="open">
<summary>Table of Contents</summary>

- [About](#about)
  - [Built With](#built-with)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
- [Usage](#usage)
- [Contributing](#contributing)
- [Authors & contributors](#authors--contributors)
- [Security](#security)
- [License](#license)
- [Acknowledgements](#acknowledgements)

</details>

---

## About

This is a simple gui wrapper around FFmpeg using electron
<br/>
The wrapper offers simple tools to set a target file size, trim options and audio merging to make it easier to share clips with friends on platforms with restricted upload sizes
<br/>

Originally this project was integrated into Better Discord as a way to ensure video files would embed correctly in Discord for previewing and ensuring that the file stayed within discords file upload constraints.
<br/>
A major update to discord changed the security policies used prevent access to necessary functions for this application to function, hence that project is deprecated.
<br/>
But due to how useful I found that application I decided to try and keep it alive in the form of an app.

### Built With

Electron and FFmpeg
<br/>
The installer is bundled by Electron Forge using Squirrel

## Getting Started

### Prerequisites

Package.json includes all the necessary dependencies.
<br/>
For compilation Electron, Electron-Forge and Electron-Forge-Squirrel is used
<br/>
For the program to run ffmpeg must be available on the system. This can either
<br/>
to the environment or the path for a local ffmpeg can be provided to the settings
<br/>

FFmpeg can be [downloaded](https://ffmpeg.org/download.html) from here

### Installation

Download the installer from the release and run it.
<br/>
Once the installer is complete the application should open on its own otherwise search for "Simple-Transcoder" in your start menu
<br/>
If you don't have ffmpeg available on your system then refer to the Prerequisites above for installer ffmpeg

<br/>

Alternatively you can clone the repo
<br/>
Ensure npm has installed all the dependencies
<br/>
Then execute nodejs ./main.js

## Usage

Ensure you have ffmpeg installed in some form on the system either as a global (Can be checked in cmd by typing 'ffmpeg --version')
<br/>
If not, then download [FFmpeg](https://ffmpeg.org/download.html) and extract the contents. Once the application window is open then under settings hit Browse and go into the ffmpeg/bin/ffmpeg.exe
<br/>

Then simply run the program, either by the start menu if installed with the installer or run the main.js file in js
<br/>
Once the window is open drag and drop a video onto the window or hit the browse button on the bottom right
<br/>
The video should load into the player
<br/>
Set the settings to what you want and set the trim options
<br/>
Once your happy with your settings hit the encode button bottom right
<br/>

The program will now transcode the video following your specifications
<br/>
The output file will appear in the same directory as the source video provided, the file will be named output.mp4

## Support

Feel free to reach out to the maintainer at one of the following places:

- [GitHub issues](https://github.com/Torca2001/Simple-Transcoder/issues/new?assignees=&labels=question&template=04_SUPPORT_QUESTION.md&title=support%3A+)
- Contact options listed on [this GitHub profile](https://github.com/Torca2001)

## Contributing

First off, thanks for taking the time to contribute! Contributions are what make the open-source community such an amazing place to learn, inspire, and create. Any contributions you make will benefit everybody else and are **greatly appreciated**.

## Authors & contributors

The original setup of this repository is by [FULL_NAME](https://github.com/Torca2001).

For a full list of all authors and contributors, see [the contributors page](https://github.com/Torca2001/Simple-Transcoder/contributors).

## Security

Simple-Transcoder follows good practices of security, but 100% security cannot be assured.
Simple-Transcoder is provided **"as is"** without any **warranty**. Use at your own risk.

## License

This project is licensed under the **GNU Public license**.

See [LICENSE](LICENSE) for more information.

## Acknowledgements

This project wouldn't be possible without FFmpeg as it is crucial in the transcoding process.
