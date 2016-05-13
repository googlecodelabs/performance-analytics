// Copyright 2016 Google Inc.
// 
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
// 
//      http://www.apache.org/licenses/LICENSE-2.0
// 
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

window.onload = function() {
  measureCssUnblockTime();
  measureWebfontPerfAndFailures();
  measureImagesVisibleTime();
  measureJavaSciptExecutionTime();
};


/**
 * Calculates the time duration between the responseEnd timing event and when
 * the CSS stops blocking rendering, then sends this measurement to Google
 * Analytics via a timing hit.
 */
function measureCssUnblockTime() {
  var cssUnblockTime = measureDuration('css:unblock');
  if (cssUnblockTime) {
    ga('send', 'timing', 'CSS', 'unblock', cssUnblockTime);
  }
}


/**
 * Creates a promise that is resolved once the web fonts are fully load or
 * is rejected if the fonts fail to load. The resolved callback calculates the
 * time duration between the responseEnd timing event and when the web fonts
 * are downloaded and active and since this measurement to Google Analytics.
 * If an error occurs loading the font, and error event is sent to Google
 * Analytics.
 */
function measureWebfontPerfAndFailures() {
  if (window.Promise) {
    new Promise(function(resolve, reject) {
      var loaded = /wf-(in)?active/.exec(document.documentElement.className);
      var success = loaded && !loaded[1]; // No "in" in the capture group.
      if (loaded) {
        success ? resolve() : reject();
      }
      else {
        var originalAciveCallback = WebFontConfig.active;
        WebFontConfig.inactive = reject;
        WebFontConfig.active = function() {
          originalAciveCallback();
          resolve();
        };
        // In case the webfont.js script failed to load.
        setTimeout(reject, WebFontConfig.timeout);
      }
    })
    .then(function() {
      var fontsActiveTime = measureDuration('fonts:active');
      if (fontsActiveTime) {
        ga('send', 'timing', 'Fonts', 'active', fontsActiveTime);
      }
    })
    .catch(function() {
      ga('send', 'event', 'Fonts', 'error');
    });
  }
}


/**
 * Calculates the time duration between the responseEnd timing event and when
 * all images are loaded and visible on the page, then sends this measurement
 * to Google Analytics via a timing hit.
 */
function measureImagesVisibleTime() {
  var imgVisibleTime = measureDuration('img:visible');
  if (imgVisibleTime) {
    ga('send', 'timing', 'Images', 'visible', imgVisibleTime);
  }
}


/**
 * Calculates the time duration between the responseEnd timing event and when
 * all synchronous JavaScript files are downloaded and executed, then sends
 * this measurement to Google Analytics via a timing hit.
 */
function measureJavaSciptExecutionTime() {
  var jsExecuteTime = measureDuration('js:execute');
  if (jsExecuteTime) {
    ga('send', 'timing', 'JavaScript', 'execute', jsExecuteTime);
  }
}


/**
 * Accepts a mark name and an optional reference point in the navigation timing
 * API and returns the time duration between the reference point and the last
 * mark (chronologically). The return value is rounded to the nearest whole
 * number to be compatible with Google Analytics.
 * @param {string} mark The mark name.
 * @param {string=} opt_reference An optional reference point from the
 *     navigation timing API. Defaults to 'responseEnd'.
 * @return {?number} The time duration rounded to the nearest millisecond
 *     or undefined.
 */
function measureDuration(mark, opt_reference) {
  if (window.__perf) {
    var reference = opt_reference || 'responseEnd';
    var name = reference + ':' + mark;

    // Clears any existing measurements with the same name.
    performance.clearMeasures(name);

    // Creates a new measurement from the reference point to the specified mark.
    // If more than one mark with this name exists, the most recent one is used.
    performance.measure(name, reference, mark);

    // Gets the value of the measurement just created.
    var measure = performance.getEntriesByName(name)[0];

    // Returns the measure duration.
    return Math.round(measure.duration);
  }
}
