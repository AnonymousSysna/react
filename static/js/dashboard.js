// static/js/dashboard.js
'use strict';

// State management
const state = {
    processing: false,
    linesArray: [],
    currentIndex: 0,
    liveResults: [],
    ccnResults: [],
    deadResults: [],
    retryResults: [],
    invalidResults: [],
    abortControllers: [],
    selectedGate: '',
    selectedAmount: 1,
    activeProcesses: 0,
    processedLines: new Set(),
    maxConcurrent: 1
};

// DOM element cache
const DOM = {
    startBtn: null,
    stopBtn: null,
    inputText: null,
    pasteBtn: null,
    progressBar: null,
    processedCount: null,
    totalCount: null,
    processStatus: null,
    clearResultsBtn: null,
    exportResultsBtn: null,
    copyActiveBtn: null,
    liveList: null,
    ccnList: null,
    deadList: null,
    retryList: null,
    liveCount: null,
    ccnCount: null,
    deadCount: null,
    invalidCount: null,
    retryCount: null,
    gatesDropdown: null,
    selectedGateText: null,
    selectedGateInput: null,
    amountDropdown: null,
    selectedAmountText: null,
    selectedAmountInput: null,
    lastResult: null,
    testModeToggle: null,
    csrfToken: null
};

// Initialize DOM cache
function cacheDOMElements() {
    DOM.startBtn = document.getElementById('startProcessBtn');
    DOM.stopBtn = document.getElementById('stopProcessBtn');
    DOM.inputText = document.getElementById('inputText');
    DOM.pasteBtn = document.getElementById('pasteBtn');
    DOM.progressBar = document.getElementById('processProgressBar');
    DOM.processedCount = document.getElementById('processedCount');
    DOM.totalCount = document.getElementById('totalCount');
    DOM.processStatus = document.getElementById('processStatus');
    DOM.clearResultsBtn = document.getElementById('clearResultsBtn');
    DOM.exportResultsBtn = document.getElementById('exportResultsBtn');
    DOM.copyActiveBtn = document.getElementById('copyActiveBtn');
    DOM.liveList = document.getElementById('liveList');
    DOM.ccnList = document.getElementById('ccnList');
    DOM.deadList = document.getElementById('deadList');
    DOM.invalidList = document.getElementById('invalidList');
    DOM.retryList = document.getElementById('retryList');
    DOM.liveCount = document.getElementById('liveCount');
    DOM.ccnCount = document.getElementById('ccnCount');
    DOM.deadCount = document.getElementById('deadCount');
    DOM.invalidCount = document.getElementById('invalidCount');
    DOM.retryCount = document.getElementById('retryCount');
    DOM.gatesDropdown = document.getElementById('gatesDropdown');
    DOM.selectedGateText = document.getElementById('selectedGate');
    DOM.selectedGateInput = document.getElementById('selected_gate');
    DOM.amountDropdown = document.getElementById('amountDropdown');
    DOM.selectedAmountText = document.getElementById('selectedAmount');
    DOM.selectedAmountInput = document.getElementById('selected_amount');
    DOM.lastResult = document.getElementById('last_result');
    DOM.testModeToggle = document.getElementById('testModeToggle');
    DOM.csrfToken = document.getElementById('csrf_token');
}

// Utility functions
const utils = {
    formatTime(date) {
        return date.toLocaleString('en-US', {
            month: '2-digit',
            day: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: true
        });
    },

    generateResultId() {
        return `result-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    },

    async copyToClipboard(text) {
        if (navigator.clipboard?.writeText) {
            try {
                await navigator.clipboard.writeText(text);
                return true;
            } catch (err) {
                console.error('Clipboard error:', err);
                return this.fallbackCopy(text);
            }
        }
        return this.fallbackCopy(text);
    },

    fallbackCopy(text) {
        const textarea = document.createElement('textarea');
        textarea.value = text;
        textarea.style.cssText = 'position:fixed;opacity:0';
        document.body.appendChild(textarea);
        textarea.select();
        
        try {
            const successful = document.execCommand('copy');
            document.body.removeChild(textarea);
            return successful;
        } catch (err) {
            console.error('Fallback copy error:', err);
            document.body.removeChild(textarea);
            return false;
        }
    },

    showToast(title, icon = 'success') {
        Swal.fire({
            toast: true,
            position: 'top-end',
            icon,
            title,
            showConfirmButton: false,
            timer: 1500,
            timerProgressBar: true,
            background: '#1e1e1e',
            color: '#f5f6fa'
        });
    },

    showAlert(options) {
        return Swal.fire({
            background: '#2b2b3d',
            color: '#e4e6f5',
            ...options
        });
    }
};

// API calls
const api = {
    async getAvailableGates() {
        const response = await fetch('/get_available_gates', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRF-Token': DOM.csrfToken.value
            }
        });
        return response.json();
    },

    async processLine(line, gate, testMode) {
        const controller = new AbortController();
        state.abortControllers.push(controller);

        try {
            const response = await fetch('/process_line', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-Token': DOM.csrfToken.value
                },
                body: JSON.stringify({
                    line,
                    csrf_token: DOM.csrfToken.value,
                    gate,
                    testmode: testMode
                }),
                signal: controller.signal
            });
            
            return await response.json();
        } finally {
            const index = state.abortControllers.indexOf(controller);
            if (index > -1) {
                state.abortControllers.splice(index, 1);
            }
        }
    }
};

// UI updates
const ui = {
    updateTime() {
        const timeElement = document.getElementById('currentTime');
        if (timeElement) {
            timeElement.textContent = new Date().toLocaleString();
        }
    },

    updateLastCheck(data) {
        const formattedTime = utils.formatTime(new Date());
        DOM.lastResult.innerHTML = `${data} >> ${formattedTime}`;
    },

    updateProgress() {
        const processedCardsCount = state.liveResults.length + state.ccnResults.length + state.invalidResults.length +
                                    state.deadResults.length + state.retryResults.length;
        const percent = state.linesArray.length > 0 
            ? Math.floor((processedCardsCount / state.linesArray.length) * 100) 
            : 0;

        DOM.progressBar.style.width = `${percent}%`;
        DOM.progressBar.textContent = `${percent}%`;
        DOM.progressBar.setAttribute('aria-valuenow', percent);
        DOM.processedCount.textContent = processedCardsCount;
    },

    updateList(list, item, countElement, count) {
        const emptyMessage = list.querySelector('.text-muted');
        if (emptyMessage) {
            list.innerHTML = '';
        }
        list.appendChild(item);
        countElement.textContent = count;
    },

    getResultHTML(label, type, line, message, resultId) {
        return `
            <div class="d-flex justify-content-between align-items-center">
                <div>
                    <span class="badge bg-${type} me-2">${label}</span>
                    <span id="${resultId}">${line}</span>
                </div>
                <div>
                    <button type="button" class="btn btn-sm btn-outline-light copy-btn bi bi-clipboard" 
                            data-copy-id="${resultId}" aria-label="Copy result">
                    </button>
                </div>
            </div>
            ${message ? `<div class="text-${type} small mt-1">${message}</div>` : ''}
        `;
    },

    showCopyFeedback(btn, success) {
        const icon = success ? 'bi-check' : 'bi-x';
        btn.classList.remove('bi-clipboard');
        btn.classList.add(icon);

        setTimeout(() => {
            btn.classList.remove(icon);
            btn.classList.add('bi-clipboard');
        }, 1500);
    },

    showButtonFeedback(btn, icon, text, originalHTML, duration = 1500) {
        btn.innerHTML = `<i class="bi ${icon} me-1"></i>${text}`;
        setTimeout(() => {
            btn.innerHTML = originalHTML;
        }, duration);
    }
};

// Core processing logic
const processor = {
    async start() {
        if (state.processing) return;

        const inputValue = DOM.inputText.value.trim();
        if (!inputValue) {
            utils.showAlert({
                icon: 'error',
                title: 'Empty Input',
                text: 'Please enter text to process'
            });
            return;
        }

        if (!state.selectedGate) {
            utils.showAlert({
                icon: 'error',
                title: 'No Gate Selected',
                text: 'Please select a payment gateway first'
            });
            return;
        }

        const result = await utils.showAlert({
            title: 'Start Processing?',
            text: `Process cards using ${DOM.selectedGateText.textContent}?`,
            icon: 'question',
            showCancelButton: true,
            confirmButtonText: 'Start',
            cancelButtonText: 'Cancel'
        });

        if (result.isConfirmed) {
            this.initializeProcessing();
        }
    },

    initializeProcessing() {
        state.processing = true;
        DOM.startBtn.disabled = true;
        DOM.stopBtn.disabled = false;

        DOM.progressBar.style.width = '0%';
        DOM.progressBar.textContent = '0%';
        DOM.progressBar.setAttribute('aria-valuenow', 0);
        DOM.processStatus.textContent = 'Processing...';
        DOM.lastResult.textContent = 'Started...';

        state.linesArray = DOM.inputText.value.split('\n').filter(line => line.trim() !== '');
        state.currentIndex = 0;
        DOM.processedCount.textContent = '0';
        DOM.totalCount.textContent = state.linesArray.length;

        state.processedLines.clear();
        ui.updateProgress();

        state.maxConcurrent = state.selectedAmount;
        state.activeProcesses = 0;

        this.fillQueue();
    },

    fillQueue() {
        if (!state.processing) return;

        while (state.activeProcesses < state.maxConcurrent && state.currentIndex < state.linesArray.length) {
            const line = state.linesArray[state.currentIndex];

            if (!state.processedLines.has(line)) {
                this.processCard(line);
                state.processedLines.add(line);
                state.activeProcesses++;
            }

            state.currentIndex++;
        }

        if (state.activeProcesses === 0 && state.currentIndex >= state.linesArray.length) {
            this.complete();
        }
    },

    async processCard(line) {
        const testMode = DOM.testModeToggle?.checked || false;

        try {
            const data = await api.processLine(line, state.selectedGate, testMode);
            this.addResult(data);
            this.removeProcessedLine(line);
            ui.updateProgress();
        } catch (error) {
            if (error.name !== 'AbortError') {
                console.error('Error:', error);
                this.addResult({ line, status: 'retry', message: 'refresh website' });
                this.removeProcessedLine(line);
                ui.updateProgress();
            }
        } finally {
            state.activeProcesses--;
            this.fillQueue();
        }
    },

    removeProcessedLine(processedLine) {
        const lines = DOM.inputText.value.split('\n');
        const lineIndex = lines.findIndex(line => line.trim() === processedLine.trim());

        if (lineIndex !== -1) {
            lines.splice(lineIndex, 1);
            DOM.inputText.value = lines.join('\n');
        }
    },

    addResult(data) {
        const { line, status, message } = data;
        const resultId = utils.generateResultId();
        const listItem = document.createElement('div');
        listItem.className = 'list-result';

        const resultConfig = {
            live: {
                label: 'LIVE',
                type: 'success',
                list: DOM.liveList,
                count: DOM.liveCount,
                results: state.liveResults,
                toast: '+1 CVV'
            },
            ccn: {
                label: 'CCN',
                type: 'warning',
                list: DOM.ccnList,
                count: DOM.ccnCount,
                results: state.ccnResults,
                toast: '+1 CCN'
            },
            retry: {
                label: 'RETRY',
                type: 'info',
                list: DOM.retryList,
                count: DOM.retryCount,
                results: state.retryResults,
                toast: null
            },
            invalid : {
                label: 'INVALID',
                type: 'secondary',
                list: DOM.invalidList,
                count: DOM.invalidCount,
                results: state.invalidResults,
                toast: null
            },
            dead: {
                label: 'DEAD',
                type: 'danger',
                list: DOM.deadList,
                count: DOM.deadCount,
                results: state.deadResults,
                toast: null
            }
        };

        const config = resultConfig[status] || resultConfig.dead;
        
        ui.updateLastCheck(`${status}_card`);
        config.results.push(data);
        listItem.innerHTML = ui.getResultHTML(config.label, config.type, line, message, resultId);
        ui.updateList(config.list, listItem, config.count, config.results.length);
        
        if (config.toast) {
            utils.showToast(config.toast, 'success');
        }
    },

    stop() {
        state.processing = false;
        DOM.startBtn.disabled = false;
        DOM.stopBtn.disabled = true;
        DOM.processStatus.textContent = 'Stopped';
        state.processedLines.clear();

        state.abortControllers.forEach(controller => controller.abort());
        state.abortControllers = [];
        state.activeProcesses = 0;
    },

    complete() {
        state.processing = false;
        DOM.startBtn.disabled = false;
        DOM.stopBtn.disabled = true;
        DOM.processStatus.textContent = 'Completed';
        ui.updateProgress();

        const total = state.liveResults.length + state.ccnResults.length + state.invalidResults.length + 
                     state.deadResults.length + state.retryResults.length;

        utils.showAlert({
            icon: 'success',
            title: 'Processing Complete',
            text: `Processed ${total} lines`
        });
        
        DOM.lastResult.textContent = 'Completed';
    }
};

// Results management
const results = {
    clear(options) {
        const clearConfig = {
            live: { results: state.liveResults, count: DOM.liveCount, list: DOM.liveList },
            ccn: { results: state.ccnResults, count: DOM.ccnCount, list: DOM.ccnList },
            dead: { results: state.deadResults, count: DOM.deadCount, list: DOM.deadList },
            invalid: { results: state.invalidResults, count: DOM.invalidCount, list: DOM.invalidList },
            retry: { results: state.retryResults, count: DOM.retryCount, list: DOM.retryList }
        };

        Object.entries(options).forEach(([key, shouldClear]) => {
            if (shouldClear && clearConfig[key]) {
                const config = clearConfig[key];
                config.results.length = 0;
                config.count.textContent = '0';
                config.list.innerHTML = `<div class="text-center text-muted py-5">No ${key} results yet</div>`;
            }
        });

        ui.showButtonFeedback(
            DOM.clearResultsBtn,
            'bi-check',
            'Cleared',
            '<i class="bi bi-trash me-1"></i>Clear'
        );
    },

    async copyActive(type) {
        const resultMap = {
            live: state.liveResults,
            ccn: state.ccnResults,
            dead: state.deadResults,
            invalid: state.invalidResults,
            retry: state.retryResults
        };

        const results = resultMap[type] || [];

        if (results.length === 0) {
            ui.showButtonFeedback(
                DOM.copyActiveBtn,
                'bi-x',
                'Empty',
                '<i class="bi bi-clipboard me-1"></i>Copy Tab'
            );
            return;
        }

        const cardText = results.map(item => item.line).join('\n');
        const success = await utils.copyToClipboard(cardText);

        ui.showButtonFeedback(
            DOM.copyActiveBtn,
            success ? 'bi-clipboard-check' : 'bi-x',
            success ? 'Copied' : 'Failed',
            '<i class="bi bi-clipboard me-1"></i>Copy Tab'
        );
    },

    export() {
        const exportData = {
            live: state.liveResults,
            ccn: state.ccnResults,
            dead: state.deadResults,
            invalid: state.invalidResults,
            retry: state.retryResults,
            summary: {
                totalProcessed: state.liveResults.length + state.ccnResults.length + 
                            state.deadResults.length + state.invalidResults.length + state.retryResults.length,
                liveCount: state.liveResults.length,
                ccnCount: state.ccnResults.length,
                deadCount: state.deadResults.length,
                invalidCount: state.invalidResults.length,
                retryCount: state.retryResults.length,
                exportDate: new Date().toISOString(),
                gate: DOM.selectedGateText.textContent
            }
        };

        const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);

        const newTab = window.open(url, '_blank');
        if (!newTab) {
            console.warn('Popup blocked. User must allow popups.');
        }

        setTimeout(() => URL.revokeObjectURL(url), 5000);
    }
};

// Event handlers
const handlers = {
    async handlePaste(e) {
        e.preventDefault();

        // If your page is currently hidden via aria-hidden, temporarily blur the focused element
        const pageContainer = document.querySelector('.page-container');
        const activeEl = document.activeElement;
        let restoreFocus = false;

        if (pageContainer?.hasAttribute('aria-hidden') && activeEl === DOM.inputText) {
            activeEl.blur(); // remove focus temporarily
            restoreFocus = true;
        }

        try {
            if (navigator.clipboard?.readText) {
                const text = await navigator.clipboard.readText();
                DOM.inputText.value = text;

                ui.showButtonFeedback(
                    DOM.pasteBtn,
                    'bi-check',
                    '',
                    '<i class="bi bi-clipboard me-1"></i>Paste'
                );

                if (restoreFocus) {
                    DOM.inputText.focus(); // restore focus safely
                }
            } else {
                this.showPastePrompt();
            }
        } catch (err) {
            console.error('Failed to read clipboard:', err);
            this.showPastePrompt();

            if (restoreFocus) {
                DOM.inputText.focus();
            }
        }
    },

    showPastePrompt() {
        utils.showAlert({
            icon: 'info',
            title: 'Paste Manually',
            text: 'Please use Ctrl+V (or Cmd+V on Mac) to paste into the text area.'
        });
        DOM.inputText.focus();
    },

    handleCopyClick(e) {
        if (e.target.classList.contains('copy-btn')) {
            const copyId = e.target.getAttribute('data-copy-id');
            if (copyId) {
                this.copyElement(copyId, e.target);
            }
        }
    },

    async copyElement(elemId, btn) {
        const el = document.getElementById(elemId);
        if (!el) return;

        const success = await utils.copyToClipboard(el.innerText);
        ui.showCopyFeedback(btn, success);
    },

    async handleStartClick() {
        await processor.start();
    },

    async handleStopClick() {
        const result = await utils.showAlert({
            title: 'Stop Processing?',
            text: 'Do you want to stop the current process?',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Stop',
            cancelButtonText: 'Continue'
        });

        if (result.isConfirmed) {
            processor.stop();
        }
    },

    async handleClearClick() {
        if (state.processing) {
            await utils.showAlert({
                icon: 'warning',
                title: 'Processing in progress',
                text: 'Stop processing before clearing results.'
            });
            return;
        }

        const result = await utils.showAlert({
            title: 'Clear Results?',
            html: `
                <div class="text-start">
                    <p>Select which results to clear:</p>
                    <div class="form-check mb-2">
                        <input class="form-check-input" type="checkbox" id="clearLive" checked>
                        <label class="form-check-label" for="clearLive">Live (${state.liveResults.length})</label>
                    </div>
                    <div class="form-check mb-2">
                        <input class="form-check-input" type="checkbox" id="clearCcn" checked>
                        <label class="form-check-label" for="clearCcn">CCN (${state.ccnResults.length})</label>
                    </div>
                    <div class="form-check mb-2">
                        <input class="form-check-input" type="checkbox" id="clearDead" checked>
                        <label class="form-check-label" for="clearDead">Dead (${state.deadResults.length})</label>
                    </div>
                    <div class="form-check mb-2">
                        <input class="form-check-input" type="checkbox" id="clearRetry" checked>
                        <label class="form-check-label" for="clearRetry">Retry (${state.retryResults.length})</label>
                    </div>
                    <div class="form-check mb-2">
                        <input class="form-check-input" type="checkbox" id="clearInvalid" checked>
                        <label class="form-check-label" for="clearInvalid">Invalid (${state.invalidResults.length})</label>
                    </div>
                </div>
            `,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Clear',
            cancelButtonText: 'Cancel',
            preConfirm: () => ({
                live: document.getElementById('clearLive').checked,
                ccn: document.getElementById('clearCcn').checked,
                dead: document.getElementById('clearDead').checked,
                retry: document.getElementById('clearRetry').checked,
                invalid: document.getElementById('clearInvalid').checked
            })
        });

        if (result.isConfirmed) {
            results.clear(result.value);
        }
    },

    handleNavigationWarning(e) {
        const link = e.target.closest('a');
        if (!link || link.getAttribute('href') === '#') return;

        if (state.processing && DOM.processStatus.textContent === 'Processing...') {
            e.preventDefault();
            e.stopPropagation();

            const targetHref = link.href;
            utils.showAlert({
                title: 'Processing in Progress',
                text: 'Navigating away will interrupt the current process. Continue?',
                icon: 'warning',
                showCancelButton: true,
                confirmButtonText: 'Continue',
                cancelButtonText: 'Stay on Page'
            }).then((result) => {
                if (result.isConfirmed) {
                    processor.stop();
                    window.location.href = targetHref;
                }
            });
        }
    }

};

// Gate management
const gates = {
    async load() {
        try {
            const data = await api.getAvailableGates();
            DOM.gatesDropdown.innerHTML = '';
            if (data.gates?.length > 0) {
                data.gates.forEach(gate => {
                    const li = document.createElement('li');
                    const a = document.createElement('a');
                    a.className = 'dropdown-item';
                    a.href = '#';
                    a.setAttribute('data-gate', gate.id);
                    a.textContent = gate.name;

                    a.addEventListener('click', (e) => {
                        e.preventDefault();
                        this.select(gate.id, gate.name);
                    });

                    li.appendChild(a);
                    DOM.gatesDropdown.appendChild(li);
                });

                this.select(data.gates[0].id, data.gates[0].name);
            } else {
                this.showError('No gates available');
                DOM.startBtn.disabled = true;
            }
        } catch (error) {
            console.error('Error loading gates:', error);
            this.showError('Error loading gates');
            DOM.startBtn.disabled = true;
        }
    },

    select(gateId, gateName) {
        state.selectedGate = gateId;
        DOM.selectedGateText.textContent = gateName;
        DOM.selectedGateInput.value = gateId;
        DOM.startBtn.disabled = false;
    },

    showError(message) {
        DOM.gatesDropdown.innerHTML = `<li><a class="dropdown-item text-danger" href="#">${message}</a></li>`;
        DOM.selectedGateText.textContent = 'Gate error';
    }

};

// Amount selection
const amounts = {
    setup() {
        DOM.amountDropdown?.querySelectorAll('a').forEach(item => {
            item.addEventListener('click', async (e) => {
                e.preventDefault();
                const amount = item.getAttribute('data-amount');
                if (amount === 'custom') {
                    const result = await utils.showAlert({
                        title: 'Enter Custom Amount',
                        input: 'number',
                        inputAttributes: {
                            min: 1,
                            max: 100,
                            step: 1
                        },
                        inputValue: state.selectedAmount,
                        showCancelButton: true,
                        inputValidator: (value) => {
                            if (!value || value < 1) {
                                return 'Please enter a valid number (minimum 1)';
                            }
                        }
                    });

                    if (result.isConfirmed) {
                        this.select(result.value);
                    }
                } else {
                    this.select(amount);
                }
            });
        });
    },

    select(amount) {
        state.selectedAmount = parseInt(amount);
        DOM.selectedAmountText.textContent = `${state.selectedAmount} Card${state.selectedAmount !== 1 ? 's' : ''}`;
        DOM.selectedAmountInput.value = state.selectedAmount;
    }

};


// Initialize application
function init() {
    cacheDOMElements();
    // Setup event listeners
    DOM.pasteBtn.addEventListener('click', handlers.handlePaste.bind(handlers));
    DOM.startBtn.addEventListener('click', handlers.handleStartClick);
    DOM.stopBtn.addEventListener('click', handlers.handleStopClick);
    DOM.clearResultsBtn.addEventListener('click', handlers.handleClearClick);
    DOM.exportResultsBtn.addEventListener('click', () => results.export());
    DOM.copyActiveBtn.addEventListener('click', () => {
        const activeTab = document.querySelector('.tab-pane.active').getAttribute('id');
        results.copyActive(activeTab);
    });

    document.addEventListener('click', handlers.handleCopyClick.bind(handlers));
    document.addEventListener('click', handlers.handleNavigationWarning.bind(handlers), true);

    // Initialize modules
    gates.load();
    amounts.setup();

    // Start time update
    ui.updateTime();
    setInterval(ui.updateTime, 1000);

}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
