# Snipe-IT Barcode Scanner

## Introduction

The purpose of this project was to work around a few current limitations of [Snipe-IT](https://github.com/snipe/snipe-it) using the v4 API. This was done for my own needs, in hopes it gets depricated into future features of Snipe-IT.

It doesn't have to look good, just needs to work. Built with barcode scanner usage in mind, something that adds a CR/LF at the end.

The wish is to walk into a managed location (COMM room, conf room, etc), or user (cubicle, etc) and just start zapping. Regardless of the current state of the asset, checked in/out, and if the asset is assigned correctly, just update how it is today. Furthermore, mark the audit date as today and set the next audit date one year away for reporting purposes.

## Features

* ~~Bulk checking out to user and location~~ (<https://demo.snipeitapp.com/hardware/bulkcheckout>)
* Bulk updating asset user and location (regardless if checked in/out)
* Bulk checking in assets
* Ability to set next audit date to one year on updating assets

## Installation

1. Clone the project into <snipe-it_root_dir/public>
1. Fetch API key from <http://snipeiturl/account/api>
1. Login and add your API key, stored in browser local storage (Optionally add to scanner.js for single user mode)
1. Access <http://snipeiturl/snipeit4-scanner> with any modern web browser

NOTE: Check folder/file ownership for the webserver (EX: chmod -R www-data:www-data <path_to_checkout>)
