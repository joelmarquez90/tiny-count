# tiny-count

A node module that iterates recursively through a directory and compresses all the images with TinyPNG

![nodei.co](https://nodei.co/npm/tiny-count.png?downloads=true&downloadRank=true&stars=true)

## Features

 - Compresses images from one directory using TinyPNG API

## Install

`npm install -g tiny-count`

## Usage

First you have to register in [TinyPNG](https://tinypng.com/) and get an API KEY. Then, you run this:

`tiny-count -k <TinyPNG API KEY> -p /path/to/your/root/images/directory`

By default, it filters the files that aren't staged in git. If you want to force the replacement, use the `-f` or `--force` option.

And you will have an output like this:

```
Compressing... [=====================         ] 82% 410/500

Size       Description
---------  -----------
10.34 MB   Before     
9.66 MB    After      
698.16 KB  Difference
```

## Author

Joel Márquez <90joelmarquez@gmail.com> http://github.com/joelmarquez90

## License

 - **MIT** : http://opensource.org/licenses/MIT
