// Converts time values to and from Seconds. Can be used in the opposite direction if the value is per time, e.g. 1 task per hour

function convertSeconds(value, units, bToSeconds) {
    'use strict';
    var conversionMap = {
        'Seconds': 1,
        'Minutes': 60,
        'Hours': 3600,
    };

conversionMap.Days = conversionMap.Hours * document.getElementById('hoursInDay').value;
conversionMap.Weeks = conversionMap.Days* document.getElementById('daysInaWeek').value;
conversionMap.Years = conversionMap.Weeks * document.getElementById('weeksInaYear').value;

    if (typeof value !== 'undefined' && typeof units !== 'undefined' && typeof bToSeconds !== 'undefined') {
        if (!!conversionMap[units]) {
            if (bToSeconds) {
                return value * conversionMap[units];
            }
            if (!bToSeconds) {
                return value / conversionMap[units];
            }
        } else {
            console.log('ERROR: convertSeconds - invalid units');
        }
    } else {
        console.log('ERROR: convertSeconds - expects (value, units, bToSeconds)');
    }
}

// Ensures that a 0% margin of error does not result in a separate, non-zero margin of error being nullified.

function zeroMarginMultiple(zeroMargin, pairedMargin) {
    'use strict';
    if (parseInt(zeroMargin, 10) === 0 && parseInt(pairedMargin, 10) !== 0) {
        zeroMargin = 1;
    }
    return zeroMargin;
}

//If a number has > 3 decimal places it is rounded to 3

function roundTo3(num) {
    'use strict';
    var postDecimal;

    postDecimal = num.toString().split(".")[1];

    if (!!postDecimal && postDecimal.length > 3) {
        return num.toFixed(3);
    }

    return num;
}

function subCalcToggle() {
    'use strict';
    var i,
        subCalcs,
        subCalcsLen;

    subCalcs = document.getElementsByClassName('subCalculator');
    subCalcsLen = subCalcs.length;

    if (document.getElementById('subCalcToggle').checked) {
        for (i = 0; i < subCalcsLen; i++) {
            subCalcs[i].classList.remove('hidden');
        }
    } else {
        for (i = 0; i < subCalcsLen; i++) {
            subCalcs[i].classList.add('hidden');
        }
    }
}

function timeConfigToggle() {
    'use strict';
    var timeUnitConfig;

    timeUnitConfig = document.getElementById('timUnitsConfigDiv');

    if (document.getElementById('timeUnitConfig').checked) {
        timeUnitConfig.classList.remove('hidden');
    } else {
        timeUnitConfig.classList.add('hidden');
    }
}

function calcBreakEven(timeSavedPerSeconds, timeSavedPerMagin, taskReps, setupTimeSeconds, setupTimeMargin) {
    'use strict';
    var breakEvenRepsAvg,
        breakEvenRepsMargin,
        breakEvenRepsFinal;

    breakEvenRepsAvg = setupTimeSeconds / timeSavedPerSeconds;
    breakEvenRepsMargin = timeSavedPerMagin + setupTimeMargin;

    if (isNaN(breakEvenRepsMargin) === true || breakEvenRepsMargin <= 0) {
        breakEvenRepsFinal = breakEvenRepsAvg;
    } else {
        breakEvenRepsFinal = breakEvenRepsAvg + ' (' + (breakEvenRepsAvg * (100 - breakEvenRepsMargin) / 100)  + ' - ' + (breakEvenRepsAvg * (100 + breakEvenRepsMargin) / 100)  + ')';
    }

    document.getElementById('breakEvenReps').value = breakEvenRepsFinal;
}

function calcTimeSaved() {
    'use strict';
    var timeSavedPerRaw,
        timeSavedPerMargin,
        timeSavedPerUnits,
        timeSavedPerSeconds,
        taskReps,
        taskRepsMargin,
        setupTimeRaw,
        setupTimeMargin,
        setupTimeUnits,
        setupTimeSeconds,
        timeSavedMargin,
        timeSavedUnits,
        timeSavedSeconds,
        timeSavedConverted,
        timeSavedFinal;

    timeSavedPerRaw = document.getElementById('timeSavedPer').valueAsNumber;
    timeSavedPerMargin = document.getElementById('timeSavedPerMargin').valueAsNumber;
    timeSavedPerUnits = document.getElementById('timeSavedPerUnits').value;

    if (timeSavedPerUnits === 'Seconds') {
        timeSavedPerSeconds = timeSavedPerRaw;
    } else {
        timeSavedPerSeconds = convertSeconds(timeSavedPerRaw, timeSavedPerUnits, true);
    }

    taskReps = document.getElementById('taskReps').valueAsNumber;
    taskRepsMargin = document.getElementById('taskRepsMargin').valueAsNumber;

    setupTimeRaw = document.getElementById('setupTime').valueAsNumber;
    setupTimeMargin = document.getElementById('setupTimeMargin').valueAsNumber;
    setupTimeUnits = document.getElementById('setupTimeUnits').value;

    setupTimeSeconds = setupTimeRaw;
    if (setupTimeUnits !== 'Seconds') {
        setupTimeSeconds = convertSeconds(setupTimeSeconds, setupTimeUnits, true);
    }

    timeSavedUnits = document.getElementById('timeSavedUnits').value;
    timeSavedSeconds = (timeSavedPerSeconds * taskReps) - setupTimeSeconds;

    timeSavedConverted = timeSavedSeconds;
    if (timeSavedUnits !== 'Seconds') {
        timeSavedConverted = convertSeconds(timeSavedConverted, timeSavedUnits, false);
    }

    timeSavedPerMargin = zeroMarginMultiple(timeSavedPerMargin, taskRepsMargin);

    taskRepsMargin = zeroMarginMultiple(taskRepsMargin, timeSavedPerMargin);

    timeSavedMargin = (timeSavedPerMargin * taskRepsMargin) + setupTimeMargin;

    if (isNaN(timeSavedMargin) === false) {
        document.getElementById('timeSavedMargin').value = timeSavedMargin;
    } else {
        document.getElementById('timeSavedMargin').value = null;
    }

    if (isNaN(timeSavedConverted) === false) {
        if (isNaN(timeSavedMargin) === true) {
            timeSavedFinal = roundTo3(timeSavedConverted);
        } else {
            timeSavedFinal = roundTo3(timeSavedConverted) + ' (' + roundTo3(timeSavedConverted * (100 - timeSavedMargin) / 100)  + ' - ' + roundTo3(timeSavedConverted * (100 + timeSavedMargin) / 100)  + ')';
        }
        document.getElementById('timeSaved').value = timeSavedFinal;

        if (timeSavedConverted >= 0) {
            calcBreakEven(timeSavedPerSeconds, timeSavedPerMargin, taskReps, setupTimeSeconds, setupTimeMargin);
        } else {
            document.getElementById('breakEvenReps').value = '';
        }
    } else {
        document.getElementById('timeSaved').value = '';
    }
}

function calcTaskReps() {
    'use strict';
    var taskReps,
        taskRepsMargin,
        taskFrequencyRaw,
        taskFrequencyConverted,
        taskFrequencyMargin,
        taskFrequencyUnits,
        taskDurationRaw,
        taskDurationConverted,
        taskDurationMargin,
        taskDurationUnits;

    taskFrequencyRaw = document.getElementById('taskFrequency').value;
    taskFrequencyUnits = document.getElementById('taskFrequencyUnits').value;
    taskDurationRaw = document.getElementById('taskDuration').value;
    taskDurationUnits = document.getElementById('taskDurationUnits').value;

    if (!!taskFrequencyRaw && !!taskDurationRaw) {
        taskFrequencyConverted = convertSeconds(taskFrequencyRaw, taskFrequencyUnits + 's', false);
        taskDurationConverted = convertSeconds(taskDurationRaw, taskDurationUnits, true);
        taskReps = taskFrequencyConverted * taskDurationConverted;
        document.getElementById('taskReps').value = taskReps;
    } else {
        document.getElementById('taskReps').value = null;
    }

    taskFrequencyMargin = document.getElementById('taskFrequencyMargin').value;
    taskDurationMargin = document.getElementById('taskDurationMargin').value;

    if (!!taskFrequencyMargin && !!taskDurationMargin) {

        taskFrequencyMargin = zeroMarginMultiple(taskFrequencyMargin, taskDurationMargin);

        taskDurationMargin = zeroMarginMultiple(taskDurationMargin, taskFrequencyMargin);

        taskRepsMargin = taskFrequencyMargin * taskDurationMargin;
        document.getElementById('taskRepsMargin').value = taskRepsMargin;
    } else {
        document.getElementById('taskRepsMargin').value = null;
    }

    calcTimeSaved();
}

function calcTimeSavedPer() {
    'use strict';
    var timeSavedPer,
        timeSavedPerConverted,
        timeSavedPerMargin,
        timeSavedPerUnits,
        timeWOAutomationRaw,
        timeWOAutomationSeconds,
        timeWOAutomationMargin,
        timeWOAutomationUnits,
        timeWAutomationRaw,
        timeWAutomationSeconds,
        timeWAutomationMargin,
        timeWAutomationUnits;

    timeWOAutomationRaw = document.getElementById('timeWOAutomation').valueAsNumber;
    timeWOAutomationUnits = document.getElementById('timeWOAutomationUnits').value;
    timeWAutomationRaw = document.getElementById('timeWAutomation').valueAsNumber;
    timeWAutomationUnits = document.getElementById('timeWAutomationUnits').value;
    timeSavedPerUnits = document.getElementById('timeSavedPerUnits').value;

    if (!!timeWOAutomationRaw && !!timeWAutomationRaw) {
        timeWOAutomationSeconds = convertSeconds(timeWOAutomationRaw, timeWOAutomationUnits, true);

        timeWAutomationSeconds = convertSeconds(timeWAutomationRaw, timeWAutomationUnits, true);

        timeSavedPer = timeWOAutomationSeconds - timeWAutomationSeconds;

        timeSavedPerConverted = convertSeconds(timeSavedPer, timeSavedPerUnits, false);

        document.getElementById('timeSavedPer').value = timeSavedPerConverted;
    } else {
        document.getElementById('timeSavedPer').value = null;
    }

    timeWOAutomationMargin = document.getElementById('timeWOAutomationMargin').valueAsNumber;
    timeWAutomationMargin = document.getElementById('timeWAutomationMargin').valueAsNumber;

    if (!!timeWOAutomationMargin && !!timeWAutomationMargin) {
        timeSavedPerMargin = timeWOAutomationMargin + timeWAutomationMargin;

        document.getElementById('timeSavedPerMargin').value = timeSavedPerMargin;
    } else {
        document.getElementById('timeSavedPerMargin').value = null;
    }

    calcTimeSaved();
}

function updateEq() {
    'use strict';
    document.getElementById('tspt').innerHTML = document.getElementById('timeSavedPer').value || 'TSpT';
    document.getElementById('r').innerHTML = document.getElementById('taskReps').value || 'R';
    document.getElementById('st').innerHTML = document.getElementById('setupTime').value || 'ST';
    document.getElementById('ts').innerHTML = document.getElementById('timeSaved').value || 'Time Saved';
}

function clearForm() {
    'use strict';
    var form,
        i,
        len;

    document.getElementById('tspt').classList.remove('selected');
    document.getElementById('r').classList.remove('selected');
    document.getElementById('st').classList.remove('selected');
    document.getElementById('ts').classList.remove('selected');

    form = document.getElementById('calcForm').childNodes;
    len = form.length;

    for (i = 0; i < len; i++) {
        if (form[i].nodeType !== 3) {
            form[i].classList.add('hidden');
        }
    }
}

function switchParam(event, id) {
    'use strict';
    var switcher = id || event.target.parentElement.id;

    switch (switcher) {
    case 'eqTimeSavedPer':
        clearForm();
        document.getElementById('timeSavedPerTaskContainer').classList.remove('hidden');
        document.getElementById('tspt').classList.add('selected');
        break;
    case 'eqTaskReps':
        clearForm();
        document.getElementById('taskRepsContainer').classList.remove('hidden');
        document.getElementById('r').classList.add('selected');
        break;
    case 'eqSetupTime':
        clearForm();
        document.getElementById('setupTimeContainer').classList.remove('hidden');
        document.getElementById('st').classList.add('selected');
        break;
    case 'eqTimeSaved':
        clearForm();
        document.getElementById('timeSavedContainer').classList.remove('hidden');
        document.getElementById('ts').classList.add('selected');
        break;
    }
}

//Ensures focus attempt isn't interrupted, particularly when used on a select list w/o moving through eq

function focusTimeOut(focusTarget) {
    'use strict';

    window.setTimeout(function () {
        document.getElementById(focusTarget).focus();
    }, 0);
}

function updateForm(event) {
    'use strict';
    switch (event.target.id) {

    case 'timeWAutomation':
    case 'timeWOAutomation':
    case 'timeWAutomationMargin':
    case 'timeWOAutomationMargin':
    case 'timeWAutomationUnits':
    case 'timeWOAutomationUnits':
        calcTimeSavedPer();
        break;

    case 'taskFrequency':
    case 'taskDuration':
    case 'taskFrequencyMargin':
    case 'taskDurationMargin':
    case 'taskFrequencyUnits':
    case 'taskDurationUnits':
        calcTaskReps();
        break;

    default:
        calcTimeSaved();
        break;
    }
    updateEq();
}

// Keyup is needed to keep equation up to date and for tab navigaton. Keypress is needed for enter navigation

document.addEventListener('keyup', updateForm);
document.addEventListener('click', updateForm);

document.getElementById('timeSavedUnits').addEventListener('change', updateForm);
document.getElementById('timeSavedPerUnits').addEventListener('change', updateForm)
document.getElementById('setupTimeUnits').addEventListener('change', updateForm)
document.getElementById('taskFrequencyUnits').addEventListener('change', updateForm)
document.getElementById('taskDurationUnits').addEventListener('change', updateForm)
document.getElementById('timeWAutomationUnits').addEventListener('change', updateForm)
document.getElementById('timeWOAutomationUnits').addEventListener('change', updateForm)

document.getElementById('eqContainer').addEventListener('click', switchParam);
document.getElementById('subCalcToggle').addEventListener('click', subCalcToggle);
document.getElementById('timeUnitConfig').addEventListener('click', timeConfigToggle);