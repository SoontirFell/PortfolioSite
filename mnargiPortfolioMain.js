contactForm = (function () {
    'use strict';
    var _alertStatus,
        _checkMessage,
        _clearForm,
        _sendEmail,
        _toggleFormDisplay;

    _alertStatus = function (status) {
        var statusField;

        statusField = document.getElementById('sendEmailStatus');

        if (status === 'success') {
            statusField.classList.remove('statusError');
            statusField.classList.add('statusSuccess');
            statusField.innerHTML = 'Success';
            setTimeout(_toggleFormDisplay, 2000);
        } else {
            statusField.classList.remove('statusSuccess');
            statusField.classList.add('statusError');
            statusField.innerHTML = 'Error';
        }
        if (statusField.classList.contains('hidden')) statusField.classList.remove('hidden');
    };

    _checkMessage = function () {
        var emailRegex,
            error,
            messageBody,
            returnAddress;

        emailRegex = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
        error = '';
        messageBody = document.getElementById('sendersMessage').value;
        returnAddress = document.getElementById('sendersEmail').value;

        if (!messageBody) {
            error += 'Please enter a message before sending.'
        }
        if (!returnAddress || !returnAddress.match(emailRegex)) {
            if (error !== '') error += '\n';
            error += 'Please enter a valid return, email address before sending.';
        }
        error !== '' ? console.log(error) : _sendEmail(messageBody, returnAddress);
    };

    _clearForm = function () {
        if(document.getElementById('contactFormGrid').classList.contains('slideOut')) {
            document.getElementById('emailFormGrid').reset();
            document.getElementById('sendEmailStatus').innerHTML = '';
        }
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
                    _alertStatus('success');
                } else {
                    _alertStatus('error');
                }
            }
        }

        xhr.send(params);
    };

    _toggleFormDisplay = function () {
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
            setTimeout(_clearForm, 10000);
        }
    };

    return {
        alertStatus: _alertStatus,
        checkMessage: _checkMessage,
        toggleFormDisplay: _toggleFormDisplay
    };
})();

document.getElementById('emailIconHeader').addEventListener('click', contactForm.toggleFormDisplay);
document.getElementById('contactFormX').addEventListener('click', contactForm.toggleFormDisplay);
document.getElementById('sendEmailButton').addEventListener('click', contactForm.checkMessage);

(function(H){H.className=H.className.replace(/\bno-js\b/,'js')})(document.documentElement)