contactForm = (function () {
    'use strict';
    var _checkMessage,
        _sendEmail,
        _sendFailure,
        _sendSuccessful,
        _toggleDisplay;

    _checkMessage = function () {
        var emailRegex,
            error,
            messageBody,
            returnAddress;

        emailRegex = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
        error = '';
        messageBody = document.getElementById('sendersMessage').value;
        returnAddress = document.getElementById('senderEmail').value;

        if (!messageBody) {
            error += 'Please enter a message before sending.'
        }
        if (!returnAddress || !returnAddress.match(emailRegex)) {
            if (error !== '') error += '\n';
            error += 'Please enter a valid return, email address before sending.';
        }
        error !== '' ? alert(error) : _sendEmail(messageBody, returnAddress);
    };

    _sendEmail = function (messageBody, returnAddress) {
        var params,
            response,
            url,
            xhr;

        url = 'https://script.google.com/macros/s/AKfycbwqUYLfOoKvycT_doUotbJH9gJB699xSCBJitPqLMTQ6ofz0Ls/exec';
        params = {
            returnAddress: returnAddress,
            messageBody: messageBody
        };

        params = Object.keys(params).map(function(k) {
            return encodeURIComponent(k) + '=' + encodeURIComponent(params[k])
        }).join('&')

        xhr = new XMLHttpRequest;

        xhr.open('POST', url, true);
        xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');

        xhr.onreadystatechange = function () {
            if(xhr.readyState === 4 ) {
                if(xhr.status === 200) {
                    _sendSuccessful();
                } else {
                    _sendFailure();
                }
            }
        }

        xhr.send(params);
    };

    _sendFailure = function () {
        alert('There was an error sending your email. Please check for any errors and try again.');
    };

    _sendSuccessful = function () {
        alert('Thank you for your email. I will get back to you as soon as possible.\n\nHave a great day!');
        _toggleDisplay();
        document.getElementById('sendersMessage').value = '';
        document.getElementById('senderEmail').value = '';
    };

    _toggleDisplay = function () {
        var contactFormGrid,
            currentlyHidden;

        contactFormGrid = document.getElementById('contactFormGrid');
        currentlyHidden = contactFormGrid.classList.contains('slideOut');

        if (currentlyHidden) {
            contactFormGrid.classList.remove('slideOut');
            contactFormGrid.classList.add('slideIn');
            document.getElementById('sendersMessage').focus();
            window.scrollTo(0, 0);
        } else {
            contactFormGrid.classList.remove('slideIn');
            contactFormGrid.classList.add('slideOut');
        }
    };

    return {
        checkMessage: _checkMessage,
        toggleDisplay: _toggleDisplay
    };
})();

document.getElementById('emailIconHeader').addEventListener('click', contactForm.toggleDisplay);
document.getElementById('contactFormX').addEventListener('click', contactForm.toggleDisplay);
document.getElementById('sendEmail').addEventListener('click', contactForm.checkMessage);