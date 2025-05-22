/*
  This project was forked from https://github.com/FeIronMonkey/jQuery.NumPad2
  with the license shown below.

  The fork's home is https://github.com/fresh-caleb/fcs.NumPad,
  with the same license.

  ----------------------------------------------------------------------------------

  The MIT License (MIT)

  Original work: Copyright (c) 2014-2015 almasaeed2010
  Derived work: Copyright (c) 2021 FeIronMonkey
                Copyright (c) 2025 Caleb White

  Permission is hereby granted, free of charge, to any person obtaining a copy of
  this software and associated documentation files (the "Software"), to deal in
  the Software without restriction, including without limitation the rights to
  use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of
  the Software, and to permit persons to whom the Software is furnished to do so,
  subject to the following conditions:

  The above copyright notice and this permission notice shall be included in all
  copies or substantial portions of the Software.

  THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
  IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS
  FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR
  COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER
  IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN
  CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
*/

/**
 * jQuery.NumPad
 *
 * Original Work: Copyright (c) 2015 Andrej Kabachnik
 * Derived work: Copyright (c) 2021 FeIronMonkey
 *               Copyright (c) 2025 Caleb White
 *
 * Licensed under the MIT license:
 * http://www.opensource.org/licenses/mit-license.php
 *
 * Project home:
 * https://github.com/fresh-caleb/fcs.NumPad
 *
 * Version: 1.4
 *
 */
(function ($) {
  /**
   * @function numpad
   * @param {object} options - The non-default options for the numpad. Instance members should correlate with members of `JQueryNumpad.defaults`. Supplied values override the defaults. Undefined values are ignored.
   */
  $.fn.numpad = function (options) {
    options = $.extend({}, JQueryNumpad.defaults, options);

    // Create a numpad. One for all elements in this jQuery selector.
    // Since numpad() can be called on multiple elements on one page, each call will create a unique numpad id.
    let id;
    let numberPadElement = {};

    // "this" is a jQuery selecton, which might contain many matches.
    return this.each((_, numpadTarget) => {
      if ($(`#${id}`).length === 0) {
        numberPadElement = new JQueryNumpad.builder(options);
        id = numberPadElement.numpad_id;
      }

      $.data(numpadTarget, 'numpad', numberPadElement);

      $(numpadTarget).attr('readonly', true).attr('data-numpad', id).addClass('nmpd-target');

      $(numpadTarget).bind(options.openOnEvent, () => {
        numberPadElement._numpad_open(options.target
          ? options.target
          : $(numpadTarget));
      });
    });
  };

  $.fn.numpad_open = function (initialValue) {
    this._numpad_getNumpadElement()._numpad_open(this.first(), initialValue);
    return this;
  }

  $.fn.numpad_close = function () {
    this._numpad_getNumpadElement()._numpad_close();
    return this;
  }

  $.fn.numpad_accept = function () {
    this._numpad_getNumpadElement()._numpad_accept(this.first());
    return this;
  }

  $.fn.numpad_unassignNumpadsFromElement = function () {
    return this.each((_, numpadTargetAsDomElement) => {
      let numpadTarget = $(numpadTargetAsDomElement)

      if (numpadTarget.attr('data-numpad')) {
        numpadTarget.removeAttr('data-numpad', '');
        numpadTarget.removeClass('nmpd-target');
        numpadTarget.removeData('numpad');
      }
    });
  }

  $.fn.numpad_deleteNumpadFromDom = function () {
    this.each((_, numpadTarget) => {
      let numpad = $.data(numpadTarget, 'numpad');
      if (numpad) {
        numpad.remove();
      }
    });

    return this.numpad_unassignNumpadsFromElement();
  }

  $.fn._numpad_getNumpadElement = function () {
    let numberPadElement = $.data(this[0], 'numpad');

    if (!numberPadElement) {
      throw 'Cannot act on a numpad prior to initialization!';
    }

    return numberPadElement;
  }
})(jQuery);


/**
 * non-static functions and methods will be merged in with existing functions on any jquery object this is used to extend
 * conflicting names may be overwritten
 * many of these functions are written as if the constructed object is merged with a jquery object (using find() and such)
 */
function JQueryNumpad() {
  // This is here to keep APEX happy.

  // Construct the class with `new JQueryNumpad.builder(options)`.
}

JQueryNumpad.builder = class {
  constructor(options) {
    this.options = options;
    this.numpad_id = `nmpd${JQueryNumpad._numpadIdCounter++}`;
    this.first_change = true;

    let numberPadElement = this._numpad_constructNewNumberPadElement(this.numpad_id, this.options);

    jQuery.extend(this, numberPadElement);

    this._numpad_initialize();

    if (this.options.draggable) {
      JQueryNumpad.makeDraggable(this.find('.nmpd-grid'), this.find('.numpad-header'));
    }

    this.trigger('numpad.create', [this]);
  }

  _numpad_initialize = () => {
    this._numpad_showOrHideButtons();
    this._numpad_registerEvents();
    this._numpad_appendToTarget();

    this.first_change = true;
    jQuery('#' + this.numpad_id + ' .numero').bind('click', this._numpad_handleCharacterButtonClick);
  }

  numpad_display = {};

  _numpad_handleCharacterButtonClick = (event) => {
    let newText = this.numpad_display.val().toString() + jQuery(event.target).text();
    if (this.first_change) {
      newText = jQuery(event.target).text();
      this.first_change = false;
    }
    this.numpad_setValue(newText);
  }

  _numpad_appendToTarget = () => {
    (this.options.appendKeypadTo
      ? this.options.appendKeypadTo
      : jQuery(document.body))
      .append(this);
  }

  _numpad_constructNewNumberPadElement = (id, options) => {
    let newElement = jQuery('<div id="' + id + '"></div>').addClass('nmpd-wrapper');

    /** @var grid jQuery object containing the grid for the numpad: the display, the buttons, etc. */
    let table = jQuery(options.html_table_mainLayout).addClass('nmpd-grid');
    newElement.grid = table;

    const columnWidthOfGrid = 4;

    let header = jQuery(options.html_label_headerContent);
    table.append(jQuery(options.html_tr_mainLayoutTableRow)
      .append(jQuery(options.html_td_mainLayoutHeaderCell).append(header).attr('colspan', columnWidthOfGrid)).addClass('numpad-header'));

    /** @var display jQuery object representing the display of the numpad (typically an input field) */
    let display = jQuery(options.html_input_display).addClass('nmpd-display');
    newElement.numpad_display = display;

    table.append((options.isDisplayVisible ? jQuery(options.html_tr_mainLayoutTableRow) : jQuery(options.html_tr_mainLayoutTableRow).css({ display: 'none' }))
      .append(jQuery(options.html_td_mainLayoutDisplayCell).attr('colspan', columnWidthOfGrid)
        .append(display)
        .append(jQuery('<input type="hidden" class="dirty" value="0"></input>'))));

    // Create rows and columns of the grid with appropriate buttons
    table.append(
      jQuery(options.html_tr_mainLayoutTableRow)
        .append(jQuery(options.html_td_mainLayoutButtonCell).append(jQuery(options.html_button_numberButton).html(7).addClass('numero')))
        .append(jQuery(options.html_td_mainLayoutButtonCell).append(jQuery(options.html_button_numberButton).html(8).addClass('numero')))
        .append(jQuery(options.html_td_mainLayoutButtonCell).append(jQuery(options.html_button_numberButton).html(9).addClass('numero')))
        .append(jQuery(options.html_td_mainLayoutButtonCell).append(jQuery(options.html_button_functionButton).html(options.textDelete).addClass('del').click(() => {
          this.numpad_setValue(this.numpad_getValue().toString().substring(0, this.numpad_getValue().toString().length - 1));
        }))),
    ).append(
      jQuery(options.html_tr_mainLayoutTableRow)
        .append(jQuery(options.html_td_mainLayoutButtonCell).append(jQuery(options.html_button_numberButton).html(4).addClass('numero')))
        .append(jQuery(options.html_td_mainLayoutButtonCell).append(jQuery(options.html_button_numberButton).html(5).addClass('numero')))
        .append(jQuery(options.html_td_mainLayoutButtonCell).append(jQuery(options.html_button_numberButton).html(6).addClass('numero')))
        .append(jQuery(options.html_td_mainLayoutButtonCell).append(jQuery(options.html_button_functionButton).html(options.textClear).addClass('clear').click(() => {
          this.numpad_setValue('');
        }))),
    ).append(
      jQuery(options.html_tr_mainLayoutTableRow)
        .append(jQuery(options.html_td_mainLayoutButtonCell).append(jQuery(options.html_button_numberButton).html(1).addClass('numero')))
        .append(jQuery(options.html_td_mainLayoutButtonCell).append(jQuery(options.html_button_numberButton).html(2).addClass('numero')))
        .append(jQuery(options.html_td_mainLayoutButtonCell).append(jQuery(options.html_button_numberButton).html(3).addClass('numero')))
        .append(jQuery(options.html_td_mainLayoutButtonCell).append(jQuery(options.html_button_functionButton).html(options.textCancel).addClass('cancel').click(() => {
          this._numpad_close();
        }))),
    ).append(
      jQuery(options.html_tr_mainLayoutTableRow)
        .append(jQuery(options.html_td_mainLayoutButtonCell).append(this._numpad_getDashOrMinusButton(options)))
        .append(jQuery(options.html_td_mainLayoutButtonCell).append(jQuery(options.html_button_numberButton).html(0).addClass('numero')))
        .append(jQuery(options.html_td_mainLayoutButtonCell).append(jQuery(options.html_button_functionButton).html(options.decimalSeparator).addClass('decimal-separator-button').click(this._numpad_handleCharacterButtonClick)))
        .append(jQuery(options.html_td_mainLayoutButtonCell).append(jQuery(options.html_button_functionButton).html(options.textDone).addClass('done'))),
    );

    // Create the backdrop of the numpad - an overlay for the main page
    newElement.append(jQuery(options.html_div_background).addClass('nmpd-overlay').click(() => { this._numpad_close(); }));

    newElement.append(table);

    return newElement;
  }

  _numpad_getDashOrMinusButton = (options) => options.isRequiredNumeric
    ? jQuery(options.html_button_functionButton).html('&plusmn;').addClass('negate-button').click(this._numpad_handleNegateButtonClick)
    : jQuery(options.html_button_functionButton).html('-').addClass('negate-button').click(this._numpad_handleCharacterButtonClick)

  _numpad_handleNegateButtonClick = (event) => {
    let currentValue = this.numpad_display.val();
    this.numpad_setValue((currentValue.startsWith('-')
      ? currentValue.substring(1, currentValue.length)
      : '-' + currentValue));
  }

  _numpad_showOrHideButtons = () => {
    if (!this.options.isPlusMinusButtonVisible) {
      this.find('.negate-button').hide();
    }

    if (!this.options.isDecimalButtonVisible) {
      this.find('.decimal-separator-button').hide();
    }
  }

  _numpad_registerEvents = () => {
    if (this.options.onKeypadCreate) {
      this.on('numpad.create', () => this.options.onKeypadCreate(this));
    }

    if (this.options.onKeypadOpen) {
      this.on('numpad.open', this.options.onKeypadOpen);
    }

    if (this.options.onKeypadClose) {
      this.on('numpad.close', args => {
        this.first_change = true;
        return this.options.onKeypadClose(args);
      });
    }

    if (this.options.onChange) {
      this.on('numpad.change', this.options.onChange);
    }
  }

  numpad_getValue = () => {
    let currentValue = this.numpad_display.val();

    if (currentValue === '') {
      return '';
    }

    if (this.options.isRequiredNumeric) {
      return this._numpad_isValueNumeric(this.numpad_display.val())
        ? parseFloat(this._numpad_normalizeDecimalSeparator(this.numpad_display.val())).toString()
        : '0';
    }

    return this.numpad_display.val();
  };

  _numpad_isValueNumeric = (obj) => {
    if (typeof obj === 'string') {
      obj = this._numpad_normalizeDecimalSeparator(obj);
    }

    return !isNaN(parseFloat(obj)) && isFinite(obj);
  };

  _numpad_normalizeDecimalSeparator = (obj) => {
    return obj.replace(this.options.decimalSeparator, '.');
  }

  _numpad_localizeDecimalSeparator = (obj) => {
    return obj.replace('.', this.options.decimalSeparator);
  }

  numpad_setValue = (value) => {
    value = this._numpad_cutStringLengthToMaximumAllowed(value);
    let nonnumericAllowedValues = ['', '-', this.options.decimalSeparator, `-${this.options.decimalSeparator}`];

    if (this.options.isRequiredNumeric && !this._numpad_isValueNumeric(value) && !nonnumericAllowedValues.includes(value)) {
      return;
    }

    this.numpad_display.val(value);
    this.find('.dirty').val('1');
    this.trigger('numpad.change', [value]);

    return this;
  };

  _numpad_cutStringLengthToMaximumAllowed = (value) => {
    let maxLengthAttribute = this.numpad_display.attr('maxLength');

    if (!maxLengthAttribute) {
      return value;
    }

    let maxLength;

    if (this.options.isRequiredNumeric) {
      let specialCharactersCount = 0;

      if (value.includes(this.options.decimalSeparator)) {
        specialCharactersCount++;
      }

      if (value.includes('-')) {
        specialCharactersCount++;
      }

      maxLength = parseInt(maxLengthAttribute) + specialCharactersCount;
    } else {
      maxLength = parseInt(maxLengthAttribute);
    }

    return value.toString().substr(0, maxLength)
  }

  _numpad_accept = (target) => {
    let finalValue = this.numpad_getValue().toString().replace('.', this.options.decimalSeparator);
    let textToWrite = this._numpad_cutStringLengthToMaximumAllowed(finalValue)

    if (target.prop('tagName') === 'INPUT') {
      target.val(textToWrite);
    } else {
      target.html(textToWrite);
    }

    this._numpad_close();

    if (target.prop('tagName') === 'INPUT') {
      target.trigger('change');
    }

    return this;
  };

  _numpad_close = () => {
    this.hide();
    this.trigger('numpad.close');
  }

  _numpad_open = (target, initialValue) => {
    // Use nmpd.display.val to avoid triggering numpad.change for the initial value
    if (initialValue) {
      if (!this._numpad_isValueNumeric(initialValue)) {
        console.error('The initialValue is not numeric.  Unable to set value.  It must be numeric.');
        return;
      }

      this.numpad_display.val(initialValue);
    } else {
      if (target.prop('tagName') === 'INPUT') {
        this.numpad_display.val(target.val());
        this.numpad_display.attr('maxLength', target.attr('maxLength'));
      } else {
        let targetText = this._numpad_isValueNumeric(target.text())
          ? target.text()
          : '';

        targetText = this._numpad_localizeDecimalSeparator(targetText);

        this.numpad_display.val(targetText);
      }
    }

    jQuery('#' + this.numpad_id + ' .dirty').val(0);

    this.show()
    JQueryNumpad.cursorFocus(this.find('.cancel'));
    this._numpad_positionElement(target);

    jQuery('#' + this.numpad_id + ' .done').off('click');
    jQuery('#' + this.numpad_id + ' .done').one('click', () => { this._numpad_accept(target); });

    this.trigger('numpad.open');

    return this;
  };

  _numpad_positionElement = (target) => {
    let position = { top: 0, left: 0 };
    let grid = this.find('.nmpd-grid');

    if (this.options.position === 'fixed') {
      position = this._numpad_calculateAbsolutePositioning(grid);
    } else if (this.options.position === 'relative') {
      position = this._numpad_calculateRelativePositioning(target, grid);
    }

    grid.css('position', 'fixed');
    grid.css('left', position.left);
    grid.css('top', position.top);

    return this;
  }

  _numpad_calculateAbsolutePositioning = (grid) => {
    let position = { top: 0, left: 0 };

    if (jQuery.type(this.options.positionX) === 'number') {
      position.left = this.options.positionX;
    } else if (this.options.positionX === 'left') {
      position.left = (jQuery(window).width() / 4) - (grid.outerWidth() / 2);
    } else if (this.options.positionX === 'right') {
      position.left = (jQuery(window).width() / 4 * 3) - (grid.outerWidth() / 2);
    } else if (this.options.positionX === 'center') {
      position.left = (jQuery(window).width() / 2) - (grid.outerWidth() / 2);
    }

    if (jQuery.type(this.options.positionY) === 'number') {
      position.top = this.options.positionY;
    } else if (this.options.positionY === 'top') {
      position.top = (jQuery(window).height() / 4) - (grid.outerHeight() / 2);
    } else if (this.options.positionY === 'bottom') {
      position.top = (jQuery(window).height() / 4 * 3) - (grid.outerHeight() / 2);
    } else if (this.options.positionY === 'middle') {
      position.top = (jQuery(window).height() / 2) - (grid.outerHeight() / 2);
    }

    return position;
  }

  _numpad_calculateRelativePositioning = (target, grid) => {
    const relativeOffset = this.options.positionRelativeOffset;
    let position = { top: 0, left: 0 };

    if (jQuery.type(this.options.positionX) === 'number') {
      position.left = target.offset().left + this.options.positionX;
    } else if (this.options.positionX === 'left') {
      position.left = target.offset().left - grid.outerWidth() - relativeOffset;
    } else if (this.options.positionX === 'right') {
      position.left = target.offset().left + target.outerWidth() + relativeOffset;
    } else if (this.options.positionX === 'center') {
      position.left = (target.offset().left + target.outerWidth() / 2) - (grid.outerWidth() / 2);
    }

    if (jQuery.type(this.options.positionY) === 'number') {
      position.top = target.offset().top + this.options.positionY;
    } else if (this.options.positionY === 'top') {
      position.top = target.offset().top - grid.outerHeight() - relativeOffset;
    } else if (this.options.positionY === 'bottom') {
      position.top = target.offset().top + target.outerHeight() + relativeOffset;
    } else if (this.options.positionY === 'middle') {
      position.top = (target.offset().top + target.outerHeight() / 2) - (grid.outerHeight() / 2);
    }

    return position;
  }

};

JQueryNumpad._numpadIdCounter = 0;

JQueryNumpad.cursorFocus = (elem) => {
  var x = window.scrollX, y = window.scrollY;
  elem.focus();
  window.scrollTo(x, y);
}

/**
 * Makes an element draggable.
 * @param {object} element - A jQuery object representing the element to drag around.
 * @param {object} dragHandleElement - A jQuery object representing the element the user "grabs" to initiate dragging.
 */
JQueryNumpad.makeDraggable = (element, dragHandleElement) => {
  let start = { x: 0, y: 0 };
  let delta = { x: 0, y: 0 };

  let startDragging = (e) => {
    e = e || window.event;
    e.preventDefault();

    start = { x: e.clientX, y: e.clientY };
    delta = { x: 0, y: 0 };

    jQuery(document).on('mouseup', stopDragging);
    jQuery(document).on('mousemove', moveElementWithCursor);

    document.addEventListener('touchend', stopDragging, false);
    document.addEventListener('touchmove', moveElementWithTouch, false);
  }

  let moveElementWithCursor = (e) => {
    e = e || window.event;
    e.preventDefault();

    delta.x = e.clientX - start.x;
    delta.y = e.clientY - start.y;

    element.css({ transform: `translate(${delta.x}px, ${delta.y}px)` });
  }

  let moveElementWithTouch = (e) => {
    e = e || window.event;
    e.preventDefault();

    delta.x = start.x - e.touches[0].pageX;
    delta.y = start.y - e.touches[0].pageY;

    start.x = e.touches[0].pageX;
    start.y = e.touches[0].pageY;

    element.css({ top: element.position().top - delta.y, left: element.position().left - delta.x });
  }

  let stopDragging = () => {
    jQuery(document).off('mouseup');
    jQuery(document).off('mousemove');

    document.removeEventListener('touchend', stopDragging);
    document.removeEventListener('touchmove', moveElementWithTouch);

    element.css('transform', ``);
    element.css({ top: element.position().top + delta.y, left: element.position().left + delta.x });
  }

  if (dragHandleElement && dragHandleElement.length > 0) {
    dragHandleElement.on('mousedown', startDragging);
    dragHandleElement.on('touchstart', startDragging);
  } else {
    element.on('mousedown', startDragging);
    element.addEventListener('touchstart', startDragging);
  }
}

JQueryNumpad.positionModes = {
  fixed: 'fixed',
  relative: 'relative',
}

JQueryNumpad.defaults = {
  /** @type {object} - A jQuery object representing the HTML element to append the numpad to.  If null, the numpad will be appended to the document body. */
  appendKeypadTo: null,

  /** @type {string} - The character used to indicate the separation between a number's whole and fractional parts. It should match what is expected for the locale of the website (',' in Germany, '.' in the United States, for example).*/
  decimalSeparator: '.',

  /** @type {boolean} - Indicates whether the user should be able to drag the numpad around on the screen. Draggable if true, statically positioned if false.*/
  draggable: true,


  /** @type {string} The template HTML for the function buttons.  Add CSS classes or styling to customize the appearance.*/
  html_button_functionButton: '<button type="button" class="t-Button t-Button--xlarge t-Button--stretch"></button>',

  /** @type {string} The template HTML for the number buttons.  Add CSS classes or styling to customize the appearance.*/
  html_button_numberButton: '<button type="button" class="t-Button t-Button--hot t-Button--xlarge"></button>',

  /** @type {string} The template HTML for the background mask.  No background mask will appear if left as default.  With Bootstrap, `'<div class="modal-backdrop in"></div>'` turns it into a background mask.*/
  html_div_background: '<div class="ui-widget-overlay ui-front"></div>',

  /** @type {string} The template HTML for the display on the numpad.  Add CSS classes or styling to customize the appearance.*/
  html_input_display: '<input type="text" class="text_field apex-item-text qtyInput" />',

  /** @type {string} The template HTML for the header.  HTML element, `<Label>` is expected.  For example, `'<label>Input Field Title</label>'`*/
  html_label_headerContent: '<span aria-hidden="true" class="title-icon fa-solid fa-braille fa-anim-vertical-shake fa-rotate-90"></span><button type="button" class="ui-button ui-corner-all ui-widget ui-button-icon-only ui-dialog-titlebar-close" title="Close" aria-label="Close"><span class="ui-button-icon ui-icon ui-icon-closethick"></span></button>',

  /** @type {string} The template HTML for the table which organizes all visible elements in the numpad.  Add CSS classes or styling to customize the appearance.*/
  html_table_mainLayout: '<table role="dialog" class="table ui-dialog ui-draggable ui-widget ui-widget-content ui-dialog--apex"><tbody class="ui-dialog-content ui-widget-content js-dialogReady"></tbody></table>',

  /** @type {string} The template HTML for the table cells which house the buttons. Add CSS classes or styling to customize the appearance.*/
  html_td_mainLayoutButtonCell: '<td></td>',

  /** @type {string} The template HTML for the table cell which houses the display.  Add CSS classes or styling to customize the appearance.*/
  html_td_mainLayoutDisplayCell: '<td style="width:100%" class="t-Form-fieldContainer--xlarge"></td>',

  /** @type {string} The template HTML for the table cell which houses the header. Add CSS classes or styling to customize the appearance.*/
  html_td_mainLayoutHeaderCell: '<td class="ui-dialog-title"></td>',

  /** @type {string} The template HTML for the rows in the table.  Add CSS classes or styling to customize the appearance.*/
  html_tr_mainLayoutTableRow: '<tr></tr>',


  /** @type {boolean} */
  isDecimalButtonVisible: true,

  /** @type {boolean} */
  isPlusMinusButtonVisible: true,

  /** @type {boolean} */
  isDisplayVisible: true,

  /** @type {boolean} - If true, only allows input which can be parsed as a number.  False allows values like '23.3.4-357'*/
  isRequiredNumeric: true,

  /** @type {string} - The event on which the numpad should be opened.*/
  openOnEvent: 'click',

  /** @type {string} - Must be one of `JQueryNumpad.positionModes`.  If 'fixed', will position the numpad relative to the document top, left.  If 'relative', will position the numpad relative to the target.*/
  position: JQueryNumpad.positionModes.fixed,

  /** @type {(string | number)} - May be 'left', 'right', 'center', or a number */
  positionX: 'center',

  /** @type {(string | number)} - May be 'top', 'bottom', 'middle', or a number */
  positionY: 'middle',

  /** @type {number} - If `position = JQueryNumpad.positionModes.relative` and `positionX` or `positionY` is set with any of the qualitative (ex. 'top' or 'left') options, this is he distance the numpad will be shown from the target. */
  positionRelativeOffset: 5,

  /** @type {object} The element which the numpad will set the value of.  If null, the target will be the object on which `.numpad()` was called.*/
  target: null,


  /** The text for the Cancel button. */
  textCancel: 'Cancel',

  /** The text for the Clear button. */
  textClear: 'Clear',

  /** The text for the Del button. */
  textDelete: 'Del',

  /** The text for the Done button. */
  textDone: 'Done',


  /** Triggers immediately after the numpad is created. The first parameter is the triggered event args.  The second parameter is the numpad as a jQuery object.*/
  onKeypadCreate: (self) => {
    // Add class to Done btn
    $(self).find('.done').attr('type', 'submit').addClass('t-Button--primary');
    $(self).find('.numpad-header').addClass('ui-dialog-titlebar');
    $(self).find('.nmpd-display').attr('readonly', true);
  },

  /** Triggers immediately after the numpad is opened.*/
  onKeypadOpen: () => { },

  /** Triggers immediately after the numpad is closed, regardless of how the user closed it.*/
  onKeypadClose: () => { },

  /** Triggers immediately after the numpad's value is changed. @param {object} event is the triggered event. @param {string} value is the new value after the change.*/
  onChange: (event) => { },
};
