/*
 * grunt-tail-wait
 * http://www.jasonds.co.uk/blog/grunt-tail-wait
 *
 * Copyright (c) 2015 Jason Dryhurst-Smith
 * Licensed under the MIT license.
 */

'use strict';

// External dependencies.
var Tail = require('tail').Tail;
var fs = require('fs');

// Export the gun task function for this module
module.exports = function (grunt) {

  // Register the task with grunt when loaded.
  grunt.registerMultiTask('tail_wait', 'Allows grunt to tail a file and wait for a speciic line', function () {

    // Make our task async.
    var done = this.async();

    // Populate some options and fail is required options are not present.
    var options = {

      // Required props.
      fileName: this.data.fileName,
      regex: this.data.regex,

      // Not required props, have defaults.
      lineSeparator: this.data.lineSeparator || "\n",
      timeout: this.data.timeout || 30000

    };

    // Create the tail for our input file.
    var fromBeginning = true;
    var watchOptions = {};
    var tail = new Tail(options.fileName, options.lineSeparator, watchOptions, fromBeginning);

    // The regular expression we want to check for.
    var regex = new RegExp(options.regex, 'g');

    // The length of time we will wait for our result.
    var timeout = options.timeout;

    // THe timer used to cancel and move on if tail fails.
    var timer = null;

    // Complete function ends grunt task and cleans up the tail.
    function complete (isSuccess) {

        // Stop the timer now we are complete.
        if (timer) {
          clearTimeout(timer);
        }

        // Stop watching the file.
        tail.unwatch();

        // Tell grunt that we have finished doing what we need to do.
        done(isSuccess);

    }

    // Set the timeout for the task, as it is async.
    timer = setTimeout(function() {

      grunt.log.error('Tail: Failed. Timeout reached.');
      complete(false);

    }, timeout);

    // Check the contents of each line tailed.
    tail.on("line", function (data) {

      // Check if the new line matched our desired output.
      if (data.match(regex)) {

        grunt.log.writeln('Tail: Success. Match found, continuing to next task.');
        complete(true);

      }

    });

    // TODO: Triggers the watch so the read for the tail starts at the start of an exisiting file. Not great.
    fs.appendFileSync(options.fileName, ' ');

  });

};