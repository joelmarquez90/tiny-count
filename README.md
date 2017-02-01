# tiny-count

A node module that iterates recursively through a directory and compresses all the images with TinyPNG

![nodei.co](https://nodei.co/npm/tiny-count.png?downloads=true&downloadRank=true&stars=true)

## Features

 - Compresses images from one directory using TinyPNG API

## Install

`npm install -g tiny-count`

## Usage

First you have to register in [TinyPNG](tinypng.com) and get an API KEY. Then, you run this:

`tiny-count -k <TinyPNG API KEY> -p /path/to/your/root/images/directory`

And you will have an output like this:

```
Size before tinifying: 128 B
Size after tinifying: 48 B
Difference: 80 B
```

## Author

Joel Márquez <90joelmarquez@gmail.com> http://github.com/joelmarquez90

## License

 - **MIT** : http://opensource.org/licenses/MIT
