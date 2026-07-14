// ==UserScript==
// @name         UTH AUTO CHECKED v2
// @namespace    http://tampermonkey.net/
// @version      2026-07-12
// @description  USE AT YOUR OWN RISK. THE DEVELOPER IS NOT RESPONSIBLE FOR ANY CONSEQUENCES, VIOLATIONS, OR ACCOUNT BANS.
// @author       AHK
// @match        https://courses.ut.edu.vn/mod/quiz/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=edu.vn
// @grant        GM_xmlhttpRequest
// @connect      qkha.dev
// ==/UserScript==

(() => {
    try {
        function formatOneQuestion(formulation, index) {
            const questionText =
                  formulation.querySelector('.qtext')?.innerText.trim().replace(/\n+/g, '\n') || '';

            const sequenceInput = formulation.querySelector(
                'input[type="hidden"][name$="_:sequencecheck"]'
            );

            const selects = [...formulation.querySelectorAll('select')].map((select) => ({
                name: select.name,
                id: select.id,
                type: 'select',
                selectedValue: select.value,
                selectedText: select.options[select.selectedIndex]?.text.trim() || '',
                options: [...select.options].map((option) => ({
                    value: option.value,
                    text: option.text.trim(),
                })),
            }));
            function getInputLabel(formulation, input) {
                const byFor = input.id
                ? formulation.querySelector(`label[for="${CSS.escape(input.id)}"]`)
                : null;

                const byAria = input.getAttribute('aria-labelledby')
                ? formulation.querySelector(`#${CSS.escape(input.getAttribute('aria-labelledby'))}`)
                : null;

                const byRegion = input.closest('.r0, .r1, .answer, .ablock')
                ?.querySelector('[data-region="answer-label"]');

                return (byFor || byAria || byRegion)?.innerText.trim().replace(/\s+/g, ' ') || input.value;
            }

            const groupInputs = (selector, type) => {
                const inputs = [...formulation.querySelectorAll(selector)];

                return Object.entries(
                    inputs.reduce((groups, input) => {
                        if (!groups[input.name]) {
                            groups[input.name] = [];
                        }
                        const label = getInputLabel(formulation, input);
                        groups[input.name].push({
                            id: input.id,
                            value: input.value,
                            label,
                            checked: input.checked,
                        });

                        return groups;
                    }, {})
                ).map(([name, options]) => ({
                    name,
                    type,
                    options,
                    selectedValues: options.filter((x) => x.checked).map((x) => x.value),
                }));
            };

            const radioGroups = groupInputs('input[type="radio"]', 'radio');
            const checkboxGroups = groupInputs('input[type="checkbox"]', 'checkbox');

            const textInputs = [...formulation.querySelectorAll('input[type="text"]')].map((input) => ({
                name: input.name,
                id: input.id,
                type: 'text',
                value: input.value,
            }));

            return {
                questionNo: index + 1,
                sequenceCheck: sequenceInput?.value || null,
                question: questionText,
                answers: {
                    selects,
                    radioGroups,
                    checkboxGroups,
                    textInputs,
                },
            };
        }

        function formatQuizData() {
            const questions = [...document.querySelectorAll('.que .formulation')];

            return questions.map((formulation, index) => {
                return formatOneQuestion(formulation, index);
            });
        }

        function dispatchNativeEvents(element) {
            element.dispatchEvent(new Event('input', { bubbles: true }));
            element.dispatchEvent(new Event('change', { bubbles: true }));
        }

        function resetQuestionAnswers(formulation) {
            formulation.querySelectorAll('select').forEach((select) => {
                select.selectedIndex = 0;
                dispatchNativeEvents(select);
            });

            formulation.querySelectorAll('input[type="radio"], input[type="checkbox"]').forEach((input) => {
                input.checked = false;
                dispatchNativeEvents(input);
            });

            formulation.querySelectorAll('input[type="text"]').forEach((input) => {
                input.value = '';
                dispatchNativeEvents(input);
            });
        }

        function applyAnswerToQuestion(answerObject, questionContainer) {
            const formulation = questionContainer.querySelector('.formulation');

            if (!formulation || !answerObject) return;

            resetQuestionAnswers(formulation);

            // Select dropdown
            for (const item of answerObject.selects || []) {
                const select =
                      formulation.querySelector(`select[name="${CSS.escape(item.name)}"]`) ||
                      formulation.querySelector(`#${CSS.escape(item.id)}`);

                if (!select) continue;

                select.value = item.value ?? item.selectedValue ?? '';
                dispatchNativeEvents(select);
            }

            // Radio
            for (const group of answerObject.radioGroups || []) {
                const selectedValue = group.selectedValue ?? group.selectedValues?.[0];

                if (selectedValue == null) continue;

                const radio = formulation.querySelector(
                    `input[type="radio"][name="${CSS.escape(group.name)}"][value="${CSS.escape(selectedValue)}"]`
                );

                if (!radio) continue;

                radio.checked = true;
                dispatchNativeEvents(radio);
            }

            // Checkbox
            for (const group of answerObject.checkboxGroups || []) {
                const selectedValues = group.selectedValues || [];

                const checkboxes = formulation.querySelectorAll(
                    `input[type="checkbox"][name="${CSS.escape(group.name)}"]`
                );

                checkboxes.forEach((checkbox) => {
                    checkbox.checked = selectedValues.includes(checkbox.value);
                    dispatchNativeEvents(checkbox);
                });
            }

            // Text input
            for (const item of answerObject.textInputs || []) {
                const input =
                      formulation.querySelector(`input[type="text"][name="${CSS.escape(item.name)}"]`) ||
                      formulation.querySelector(`#${CSS.escape(item.id)}`);

                if (!input) continue;

                input.value = item.value;
                dispatchNativeEvents(input);
            }
        }
        function gmRequest(options) {
            return new Promise((resolve, reject) => {
                GM_xmlhttpRequest({
                    ...options,

                    onload(response) {
                        resolve(response);
                    },

                    onerror(error) {
                        reject(new Error('Không thể kết nối đến API'));
                    },

                    ontimeout() {
                        reject(new Error('API request timeout'));
                    },

                    onabort() {
                        reject(new Error('API request đã bị hủy'));
                    },
                });
            });
        }

        // Nhấp đúp vào container câu hỏi thì log ra object của câu đó
        document.addEventListener('dblclick', async function (event) {
            const questionContainer = event.target.closest('.que');

            if (!questionContainer) return;

            const formulation = questionContainer.querySelector('.formulation');

            if (!formulation) return;

            const allFormulations = [...document.querySelectorAll('.que .formulation')];
            const questionIndex = allFormulations.indexOf(formulation);

            const questionObject = formatOneQuestion(formulation, questionIndex);

            console.log('Question object:', questionObject);

            try {
                // questionContainer.style.opacity = '0.5';

                const response = await gmRequest({
                    method: 'POST',
                    url: 'https://qkha.dev/api/ai?token=4b16afb9-4caf-4464-b3d1-e7cb2c53c7e7',

                    headers: {
                        'Content-Type': 'application/json',
                        'Accept': 'application/json',
                    },

                    data: JSON.stringify({
                        quizData: [questionObject],
                    }),

                    timeout: 30000,
                });

                let data;

                try {
                    data = JSON.parse(response.responseText);
                } catch (parseError) {
                    throw new Error('API trả về dữ liệu không phải JSON');
                }

                if (response.status < 200 || response.status >= 300) {
                    throw new Error(
                        data?.message ||
                        `Call API failed. HTTP status: ${response.status}`
                    );
                }

                console.log('AI answer:', data);

                const answerObject =
                      data?.answers?.[0] ||
                      data?.text?.answers?.[0];

                if (!answerObject) {
                    throw new Error('API không trả về answers[0]');
                }

                applyAnswerToQuestion(answerObject, questionContainer);
            } catch (error) {
                console.error('API error:', error);
            } finally {
                // questionContainer.style.opacity = '1';
            }
        });

        (() => {
            const allow = (event) => {
                event.stopImmediatePropagation();
                return true;
            };

            [
                'contextmenu',
                'selectstart',
                'copy',
                'cut',
                'paste',
                'dragstart',
                'mousedown',
                'mouseup',
                'keydown'
            ].forEach((eventName) => {
                window.addEventListener(eventName, allow, true);
                document.addEventListener(eventName, allow, true);
            });

            const style = document.createElement('style');
            style.textContent = `
						* {
							user-select: text !important;
							-webkit-user-select: text !important;
							-moz-user-select: text !important;
							-ms-user-select: text !important;
							-webkit-touch-callout: default !important;
						}
					`;
            document.head.appendChild(style);

            document.querySelectorAll('*').forEach((el) => {
                el.oncontextmenu = null;
                el.onselectstart = null;
                el.oncopy = null;
                el.oncut = null;
                el.onpaste = null;
                el.ondragstart = null;
                el.onmousedown = null;
                el.onmouseup = null;
                el.onkeydown = null;

                el.removeAttribute('oncontextmenu');
                el.removeAttribute('onselectstart');
                el.removeAttribute('oncopy');
                el.removeAttribute('oncut');
                el.removeAttribute('onpaste');
                el.removeAttribute('ondragstart');
                el.removeAttribute('onmousedown');
                el.removeAttribute('onmouseup');
                el.removeAttribute('onkeydown');
            });

            console.log('ALLOW COPY ACTIVE');
        })();
        console.log('TOOL ACTIVE');
    } catch (error) {
        console.error('Test script failed', error);
        return 'error: ' + (error && error.message ? error.message : error);
    }
})();