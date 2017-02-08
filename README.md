# Norgeskart3
Norgeskart version 3

The content of norgeskart.no and this repository is available under the following licenses:

* Kartverkets logo and font: (C) Kartverket. 
* OpenLayers and all contributions to openlayers, included at /lib/src/openlayers: BSD style - see https://github.com/openlayers/openlayers/blob/master/LICENSE.md
* Everything else: Public Domain.

The solution uses web services from Kartverket which are subject to their own licenses (mostly CC-BY 3.0 Norway) and the Norwegian Geodata law. See http://kartverket.no/data/lisens/ for the license terms and http://kartverket.no/data/ for details on the web services.


Installation
------------
    1. Install nodejs and bower, make sure you can run the commands "node" and "bower" in your preferred command line    
    2. Install $ npm -g install grunt-cli karma bower
    3. Install ruby and compass to build scss
        3.1 Install ruby 1.9.3 http://rubyinstaller.org/
        3.2 Add ruby executables to your PATH 
        3.3 Verify that the command "ruby -v" outputs the ruby version in your terminal
        3.4 run "gem update --system"
        3.5 run "gem install compass"    
    4. Run "npm install" on the command line from within the fetched directory
    5. Run "bower install"
    6. Build and run unit tests with "grunt default"


Learn
------------

At a high level, the structure looks roughly like this:

```
ng-boilerplate/
  |- grunt-tasks/
  |- karma/
  |- src/
  |  |- app/
  |  |  |- <app logic>
  |  |- assets/
  |  |  |- <static files>
  |  |- common/
  |  |  |- <reusable code>
  |  |- less/
  |  |  |- main.less
  |- vendor/
  |  |- angular-bootstrap/
  |  |- bootstrap/
  |  |- placeholders/
  |- .bowerrc
  |- bower.json
  |- build.config.js
  |- Gruntfile.js
  |- module.prefix
  |- module.suffix
  |- package.json
```

What follows is a brief description of each entry, but most directories contain
their own `README.md` file with additional documentation, so browse around to
learn more.

- `karma/` - test configuration.
- `src/` - our application sources. [Read more &raquo;](src/README.md)
- `vendor/` - third-party libraries. [Bower](http://bower.io) will install
  packages here. Anything added to this directory will need to be manually added
  to `build.config.js` and `karma/karma-unit.js` to be picked up by the build
  system.
- `.bowerrc` - the Bower configuration file. This tells Bower to install
  components into the `vendor/` directory.
- `bower.json` - this is our project configuration for Bower and it contains the
  list of Bower dependencies we need.
- `build.config.js` - our customizable build settings.
- `Gruntfile.js` - our build script.
- `module.prefix` and `module.suffix` - our compiled application script is
  wrapped in these, which by default are used to place the application inside a
  self-executing anonymous function to ensure no clashes with other libraries.
- `package.json` - metadata about the app, used by NPM and our build script. Our
  NPM dependencies are listed here.