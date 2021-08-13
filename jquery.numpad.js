/*
	This file was forked from https://github.com/kabachello/jQuery.NumPad
		with the license shown below.
   
	This license only applies to this file and others from the same project, which
	also are prefixed with this header.  This file may have been modified, but the
	license still applies.

	----------------------------------------------------------------------------------
   
	The MIT License (MIT)

	Copyright (c) 2014-2015 almasaeed2010

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
 * Copyright (c) 2015 Andrej Kabachnik
 *
 * Licensed under the MIT license:
 * http://www.opensource.org/licenses/mit-license.php
 *
 * Project home:
 * https://github.com/kabachello/jQuery.NumPad
 *
 * Version: 1.4
 *
 */
 (function ($) {
	$.fn.numpad = function (options) {
		options = $.extend({}, JQueryNumpad.defaults, options);

		// Create a numpad. One for all elements in this jQuery selector.
		// Since numpad() can be called on multiple elements on one page, each call will create a unique numpad id.
		let id = 'nmpd' + ($('.nmpd-wrapper').length + 1);
		let numberPadElement = {};

		// "this" is a jQuery selecton, which might contain many matches.
		return this.each((_, numpadTarget) => {
			if ($(`#${id}`).length === 0) {
				numberPadElement = new JQueryNumpad(options, id);
			}

			$.data(numpadTarget, 'numpad', numberPadElement);

			$(numpadTarget).attr("readonly", true).attr('data-numpad', id).addClass('nmpd-target');

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

	$.fn._numpad_getNumpadElement = function () {
		let numberPadElement = $.data(this[0], 'numpad');

		if (!numberPadElement) {
			throw "Cannot act on a numpad prior to initialization!";
		}

		return numberPadElement;
	}
})(jQuery);


/**
 * non-static functions and methods will be merged in with existing functions on any jquery object this is used to extend
 * conflicting names may be overwritten
 * many of these functions are written as if the constructed object is merged with a jquery object (using find() and such)
 * */
class JQueryNumpad {
	constructor(options, id) {
		this.options = options;
		this.numpad_id = id;

		let numberPadElement = this._numpad_constructNewNumberPadElement(id, this.options);

		$.extend(this, numberPadElement);

		this._numpad_initialize();
	}

	_numpad_initialize = () => {
		this._numpad_showOrHideButtons();
		this._numpad_registerEvents();
		this._numpad_appendToTarget();

		$('#' + this.numpad_id + ' .numero').bind('click', this._numpad_handleCharacterButtonClick);

		this.trigger('numpad.create');
	}

	numpad_display = {};

	_numpad_handleCharacterButtonClick = (event) => {
		let newText = this.numpad_display.val().toString() + $(event.target).text();
		this.numpad_setValue(newText);
	}

	_numpad_appendToTarget = () => {
		(this.options.appendKeypadTo 
			? this.options.appendKeypadTo 
			: $(document.body))
			.append(this);
	}

	static cursorFocus = (elem) => {
		var x = window.scrollX, y = window.scrollY;
		elem.focus();
		window.scrollTo(x, y);
	}

	_numpad_constructNewNumberPadElement = (id, options) => {
		let newElement = $('<div id="' + id + '"></div>').addClass('nmpd-wrapper');

		/** @var display jQuery object representing the display of the numpad (typically an input field) */
		let display = $(options.html_input_display).addClass('nmpd-display');
		newElement.numpad_display = display;

		/** @var grid jQuery object containing the grid for the numpad: the display, the buttons, etc. */
		let table = $(options.html_table_mainLayout).addClass('nmpd-grid');
		newElement.grid = table;

		table.append($(options.html_tr_mainLayoutTableRow)
			.append($(options.html_td_mainLayoutDisplayCell)
				.append(display)
				.append($('<input type="hidden" class="dirty" value="0"></input>'))));

		// Create rows and columns of the the grid with appropriate buttons
		table.append(
			$(options.html_tr_mainLayoutTableRow)
				.append($(options.html_td_mainLayoutButtonCell).append($(options.html_button_numberButton).html(7).addClass('numero')))
				.append($(options.html_td_mainLayoutButtonCell).append($(options.html_button_numberButton).html(8).addClass('numero')))
				.append($(options.html_td_mainLayoutButtonCell).append($(options.html_button_numberButton).html(9).addClass('numero')))
				.append($(options.html_td_mainLayoutButtonCell).append($(options.html_button_functionButton).html(options.textDelete).addClass('del').click(() => {
					this.numpad_setValue(this.numpad_getValue().toString().substring(0, this.numpad_getValue().toString().length - 1));
				})))
		).append(
			$(options.html_tr_mainLayoutTableRow)
				.append($(options.html_td_mainLayoutButtonCell).append($(options.html_button_numberButton).html(4).addClass('numero')))
				.append($(options.html_td_mainLayoutButtonCell).append($(options.html_button_numberButton).html(5).addClass('numero')))
				.append($(options.html_td_mainLayoutButtonCell).append($(options.html_button_numberButton).html(6).addClass('numero')))
				.append($(options.html_td_mainLayoutButtonCell).append($(options.html_button_functionButton).html(options.textClear).addClass('clear').click(() => {
					this.numpad_setValue('');
				})))
		).append(
			$(options.html_tr_mainLayoutTableRow)
				.append($(options.html_td_mainLayoutButtonCell).append($(options.html_button_numberButton).html(1).addClass('numero')))
				.append($(options.html_td_mainLayoutButtonCell).append($(options.html_button_numberButton).html(2).addClass('numero')))
				.append($(options.html_td_mainLayoutButtonCell).append($(options.html_button_numberButton).html(3).addClass('numero')))
				.append($(options.html_td_mainLayoutButtonCell).append($(options.html_button_functionButton).html(options.textCancel).addClass('cancel').click(() => {
					this._numpad_close();
				})))
		).append(
			$(options.html_tr_mainLayoutTableRow)
				.append($(options.html_td_mainLayoutButtonCell).append($(options.html_button_functionButton).html('&plusmn;').addClass('negate-button').click(() => {
					let currentValue = this.numpad_display.val();
					this.numpad_setValue((currentValue.startsWith('-')
						? currentValue.substring(1, currentValue.length)
						: '-' + currentValue));
				})))
				.append($(options.html_td_mainLayoutButtonCell).append($(options.html_button_numberButton).html(0).addClass('numero')))
				.append($(options.html_td_mainLayoutButtonCell).append($(options.html_button_functionButton).html(options.decimalSeparator).addClass('decimal-separator-button').click(() => {
					this.numpad_setValue(this.numpad_display.val() + options.decimalSeparator);
				})))
				.append($(options.html_td_mainLayoutButtonCell).append($(options.html_button_functionButton).html(options.textDone).addClass('done')))
		);

		// Create the backdrop of the numpad - an overlay for the main page
		newElement.append($(options.html_div_background).addClass('nmpd-overlay').click(() => { this._numpad_close(); }));

		newElement.append(table);

		return newElement;
	}

	_numpad_showOrHideButtons = () => {
		if (this.options.hidePlusMinusButton) {
			this.find('.negate-button').hide();
		}

		if (this.options.hideDecimalButton) {
			this.find('.decimal-separator-button').hide();
		}
	}

	_numpad_registerEvents = () => {
		if (this.options.onKeypadCreate) {
			this.on('numpad.create', this.options.onKeypadCreate);
		}

		if (this.options.onKeypadOpen) {
			this.on('numpad.open', this.options.onKeypadOpen);
		}

		if (this.options.onKeypadClose) {
			this.on('numpad.close', this.options.onKeypadClose);
		}

		if (this.options.onChange) {
			this.on('numpad.change', this.options.onChange);
		}
	}

	numpad_getValue = () => {
		return this._numpad_isValueNumeric(this.numpad_display.val())
			? parseFloat(this._numpad_normalizeDecimalSeparator(this.numpad_display.val()))
			: 0;
	};

	_numpad_isValueNumeric = (obj) => {
		if (typeof obj === "string") {
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

		if (!this._numpad_isValueNumeric(value) && !nonnumericAllowedValues.includes(value)) {
			return;
		}

		this.numpad_display.val(value);
		this.find('.dirty').val('1');
		this.trigger('numpad.change', [value]);

		return this;
	};

	_numpad_cutStringLengthToMaximumAllowed = (value) => {
		let maxLengthExcludingSpecialCharacters = this.numpad_display.attr('maxLength');

		if (!maxLengthExcludingSpecialCharacters) {
			return value;
		}

		let specialCharactersCount = 0;

		if (value.includes(this.options.decimalSeparator)) {
			specialCharactersCount++;
		}

		if (value.includes('-')) {
			specialCharactersCount++;
		}

		let maxLength = parseInt(maxLengthExcludingSpecialCharacters) + specialCharactersCount;

		return value.toString().substr(0, maxLength)
	}

	_numpad_accept = (target) => {
		let finalValue = this.numpad_getValue().toString().replace('.', this.options.decimalSeparator);
		let textToWrite = this._numpad_cutStringLengthToMaximumAllowed(finalValue)

		if (target.prop("tagName") === 'INPUT') {
			target.val(textToWrite);
		}
		else {
			target.html(textToWrite);
		}

		this._numpad_close();

		if (target.prop("tagName") === 'INPUT') {
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
				console.error("The initialValue is not numeric.  Unable to set value.  It must be numeric.");
				return;
			}

			this.numpad_display.val(initialValue);
		}
		else {
			if (target.prop("tagName") === 'INPUT') {
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

		$('#' + this.numpad_id + ' .dirty').val(0);

		this.show()
		JQueryNumpad.cursorFocus(this.find('.cancel'));
		JQueryNumpad.positionElement(this.find('.nmpd-grid'), this.options.position, this.options.positionX, this.options.positionY);

		$('#' + this.numpad_id + ' .done').off('click');
		$('#' + this.numpad_id + ' .done').one('click', () => { this._numpad_accept(target); });

		// Finally trigger numpad.open
		this.trigger('numpad.open');

		return this;
	};

	static positionElement = (element, mode, posX, posY) => {
		var x = 0;
		var y = 0;

		if (mode === 'fixed') {
			element.css('position', 'fixed');
			
			if ($.type(posX) === 'number') {
				x = posX;
			}
			else if (posX === 'left') {
				x = 0;
			}
			else if (posX === 'right') {
				x = $(window).width() - element.outerWidth();
			}
			else if (posX === 'center') {
				x = ($(window).width() / 2) - (element.outerWidth() / 2);
			}

			element.css('left', x);

			if ($.type(posY) === 'number') {
				y = posY;
			}
			if (posY === 'top') {
				y = 0;
			}
			else if (posY === 'bottom') {
				y = $(window).height() - element.outerHeight();
			}
			else if (posY === 'middle') {
				y = ($(window).height() / 2) - (element.outerHeight() / 2);
			}

			element.css('top', y);
		}

		return element;
	}

	static defaults = {
		appendKeypadTo: false,
		decimalSeparator: '.',

		html_button_functionButton: '<button></button>',
		html_button_numberButton: '<button></button>',
		html_div_background: '<div></div>',
		html_input_display: '<input type="text" />',
		html_table_mainLayout: '<table></table>',
		html_td_mainLayoutButtonCell: '<td></td>',
		html_td_mainLayoutDisplayCell: '<td colspan="4"></td>',
		html_tr_mainLayoutTableRow: '<tr></tr>',
		
		hideDecimalButton: false,
		hidePlusMinusButton: false,
		
		openOnEvent: 'click',
		
		position: 'fixed',
		/** may be 'left', 'right', 'center', or a number */
		positionX: 'center',
		/** may be 'top', 'bottom', 'middle', or a number */
		positionY: 'middle',

		target: null,
		
		textCancel: 'Cancel',
		textClear: 'Clear',
		textDelete: 'Del',
		textDone: 'Done',
		
		onKeypadCreate: () => {},
		onKeypadOpen: () => {},
		onKeypadClose: () => {},
		onChange: () => {},
	};
}
