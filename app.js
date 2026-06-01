document.addEventListener('DOMContentLoaded', () => {
    initTabs();
    initCurrencyInputs();
    initDeductionToggle();
    attachListeners();
    recalculate();
});

function initTabs() {
    document.querySelectorAll('.tab').forEach(tab => {
        tab.addEventListener('click', () => {
            document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
            document.querySelectorAll('.tab-content').forEach(tc => tc.classList.remove('active'));
            tab.classList.add('active');
            document.getElementById('tab-' + tab.dataset.tab).classList.add('active');
        });
    });
}

function initCurrencyInputs() {
    document.querySelectorAll('.currency-input').forEach(input => {
        input.addEventListener('focus', () => {
            if (input.value === '0') input.value = '';
        });
        input.addEventListener('blur', () => {
            const raw = input.value.replace(/[^0-9.]/g, '');
            const num = parseFloat(raw) || 0;
            input.value = formatNumber(num);
        });
        input.addEventListener('input', () => {
            const pos = input.selectionStart;
            const oldLen = input.value.length;
            const raw = input.value.replace(/[^0-9.]/g, '');
            input.value = raw;
            recalculate();
        });
    });
}

function initDeductionToggle() {
    document.querySelectorAll('input[name="deduction-type"]').forEach(radio => {
        radio.addEventListener('change', () => {
            const itemizedSection = document.getElementById('itemized-section');
            if (radio.value === 'itemized') {
                itemizedSection.classList.remove('hidden');
            } else {
                itemizedSection.classList.add('hidden');
            }
            recalculate();
        });
    });
}

function attachListeners() {
    const allInputs = document.querySelectorAll('input, select');
    allInputs.forEach(input => {
        input.addEventListener('change', recalculate);
        if (input.type === 'number') {
            input.addEventListener('input', recalculate);
        }
    });
}

function getVal(id) {
    const el = document.getElementById(id);
    if (!el) return 0;
    const raw = el.value.replace(/[^0-9.]/g, '');
    return parseFloat(raw) || 0;
}

function getIntVal(id) {
    return parseInt(document.getElementById(id).value) || 0;
}

function formatCurrency(amount) {
    const abs = Math.abs(amount);
    const formatted = abs.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
    return (amount < 0 ? '-$' : '$') + formatted;
}

function formatNumber(num) {
    return num.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

function recalculate() {
    const deductionType = document.querySelector('input[name="deduction-type"]:checked').value;
    const filingStatus = document.getElementById('filing-status').value;

    const inputs = {
        filingStatus,
        numDependents: getIntVal('num-dependents'),
        numOtherDependents: getIntVal('num-other-dependents'),
        wages1: getVal('wages-1'),
        wages2: getVal('wages-2'),
        selfEmploymentIncome: getVal('self-employment-income'),
        selfEmploymentExpenses: getVal('self-employment-expenses'),
        interestIncome: getVal('interest-income'),
        dividendIncome: getVal('dividend-income'),
        shortTermGains: getVal('short-term-gains'),
        longTermGains: getVal('long-term-gains'),
        otherIncome: getVal('other-income'),
        deductionType,
        mortgageInterest: getVal('mortgage-interest'),
        saltDeduction: getVal('salt-deduction'),
        charitableCash: getVal('charitable-cash'),
        charitableNonCash: getVal('charitable-noncash'),
        medicalExpenses: getVal('medical-expenses'),
        otherItemized: getVal('other-itemized'),
        studentLoanInterest: getVal('student-loan-interest'),
        hsaContribution: getVal('hsa-contribution'),
        educatorExpenses: getVal('educator-expenses'),
        dependentCareExpenses: getVal('dependent-care-expenses'),
        educationExpenses: getVal('education-expenses'),
        numStudents: getIntVal('num-students'),
        evCredit: getVal('ev-credit'),
        energyCredit: getVal('energy-credit'),
        traditional401k: getVal('traditional-401k'),
        spouse401k: getVal('spouse-401k'),
        roth401k: getVal('roth-401k'),
        spouseRoth401k: getVal('spouse-roth-401k'),
        traditionalIRA: getVal('traditional-ira'),
        spouseIRA: getVal('spouse-ira'),
        rothIRA: getVal('roth-ira'),
        spouseRothIRA: getVal('spouse-roth-ira'),
        federalWithheld: getVal('federal-withheld'),
        estimatedPayments: getVal('estimated-payments')
    };

    const result = calculateTax(inputs);
    updateDashboard(result);
    updateDeductions(result, filingStatus);
    updateCredits(result);
    updateRetirement(result);
    updateWithholding(result);
    updateBreakdown(result, filingStatus);
}

function updateDashboard(r) {
    document.getElementById('sum-total-tax').textContent = formatCurrency(r.totalTax);
    document.getElementById('sum-effective-rate').textContent = r.effectiveRate.toFixed(1) + '% effective rate';

    document.getElementById('sum-take-home').textContent = formatCurrency(r.takeHome);
    document.getElementById('sum-take-home-monthly').textContent = formatCurrency(r.takeHome / 12) + ' / month';

    document.getElementById('sum-credits').textContent = formatCurrency(r.totalCredits);
    const creditParts = [];
    if (r.ctc > 0) creditParts.push('CTC');
    if (r.cdcc > 0) creditParts.push('CDCC');
    if (r.eitc > 0) creditParts.push('EITC');
    if (r.aoc > 0) creditParts.push('AOC');
    if (r.otherCredits > 0) creditParts.push('Other');
    document.getElementById('sum-credits-detail').textContent = creditParts.length > 0 ? creditParts.join(' + ') : 'No credits applied';

    const refundEl = document.getElementById('sum-refund');
    const refundDetailEl = document.getElementById('sum-refund-detail');
    const refundCard = refundEl.closest('.summary-card');

    if (r.totalPaid === 0 && r.totalTax === 0) {
        refundEl.textContent = '$0';
        refundDetailEl.textContent = 'Enter withholdings to check';
        refundCard.style.borderLeftColor = 'var(--warning)';
    } else if (r.refundOrOwe >= 0) {
        refundEl.textContent = '+' + formatCurrency(r.refundOrOwe);
        refundDetailEl.textContent = 'Estimated refund';
        refundCard.style.borderLeftColor = 'var(--success)';
    } else {
        refundEl.textContent = formatCurrency(r.refundOrOwe);
        refundDetailEl.textContent = 'Estimated amount owed';
        refundCard.style.borderLeftColor = 'var(--danger)';
    }
}

function updateDeductions(r, status) {
    document.getElementById('standard-deduction-amount').textContent = formatCurrency(r.standardDeduction);
    document.getElementById('itemized-total-display').textContent = formatCurrency(r.itemizedTotal);

    const rec = document.getElementById('deduction-recommendation');
    if (r.deductionType === 'itemized' && r.itemizedTotal < r.standardDeduction) {
        rec.innerHTML = '<strong>Heads up:</strong> Your itemized deductions (' + formatCurrency(r.itemizedTotal) + ') are less than the standard deduction (' + formatCurrency(r.standardDeduction) + '). Switching to standard would save you more.';
        rec.style.display = 'block';
    } else if (r.deductionType === 'standard' && r.itemizedTotal > r.standardDeduction) {
        rec.innerHTML = '<strong>Tip:</strong> Your itemized deductions would be ' + formatCurrency(r.itemizedTotal) + ', which is more than the standard deduction. Consider switching to itemized.';
        rec.style.display = 'block';
    } else {
        rec.innerHTML = '<strong>Recommendation:</strong> Based on your inputs, the ' + r.deductionType + ' deduction is the better choice.';
        rec.style.display = 'block';
    }
}

function updateCredits(r) {
    document.getElementById('ctc-value').textContent = formatCurrency(r.ctc);
    document.getElementById('cdcc-value').textContent = formatCurrency(r.cdcc);
    document.getElementById('eitc-value').textContent = formatCurrency(r.eitc);
    document.getElementById('aoc-value').textContent = formatCurrency(r.aoc);
    document.getElementById('other-credits-value').textContent = formatCurrency(r.otherCredits);
}

function updateRetirement(r) {
    document.querySelector('#impact-401k .impact-value').textContent = formatCurrency(r.trad401kSavings);
    document.querySelector('#impact-ira .impact-value').textContent = formatCurrency(r.tradIRASavings);

    const tip = document.getElementById('retirement-tip');
    if (r.marginalRate >= 0.24) {
        tip.textContent = 'At your ' + (r.marginalRate * 100).toFixed(0) + '% marginal rate, Traditional (pre-tax) contributions save you significantly. Every $1,000 in a Traditional 401(k) saves you $' + (r.marginalRate * 1000).toFixed(0) + ' in taxes this year.';
    } else if (r.marginalRate >= 0.12) {
        tip.textContent = 'At your ' + (r.marginalRate * 100).toFixed(0) + '% marginal rate, consider a mix of Traditional and Roth contributions. Roth is great if you expect your income (and tax rate) to be higher in retirement.';
    } else {
        tip.textContent = 'At your current low tax rate, Roth contributions may be the better choice — you pay a small amount of tax now, but all future growth and withdrawals are tax-free.';
    }
}

function updateWithholding(r) {
    const barPaid = document.getElementById('bar-paid');
    const barOwed = document.getElementById('bar-owed');
    const summary = document.getElementById('withholding-summary');

    if (r.totalTax === 0 && r.totalPaid === 0) {
        barPaid.style.width = '0%';
        barPaid.querySelector('span').textContent = '';
        barOwed.querySelector('span').textContent = 'Enter income and withholding';
        summary.innerHTML = '<p>Enter your withholding amounts above to see if you\'re on track.</p>';
        return;
    }

    const total = Math.max(r.totalTax, r.totalPaid, 1);
    const paidPct = Math.min((r.totalPaid / total) * 100, 100);
    barPaid.style.width = paidPct + '%';
    barPaid.querySelector('span').textContent = paidPct > 15 ? 'Paid: ' + formatCurrency(r.totalPaid) : '';
    barOwed.querySelector('span').textContent = 'Tax: ' + formatCurrency(r.totalTax);

    if (r.refundOrOwe >= 0) {
        summary.innerHTML = '<p>You\'re on track for a <span class="refund">refund of ' + formatCurrency(r.refundOrOwe) + '</span></p>';
    } else {
        summary.innerHTML = '<p>You may <span class="owe">owe ' + formatCurrency(Math.abs(r.refundOrOwe)) + '</span> at tax time</p>';
    }
}

function updateBreakdown(r, status) {
    setText('bk-gross-income', 'Gross Income', formatCurrency(r.grossIncome));
    setText('bk-adjustments', 'Adjustments (Above-the-Line)', '-' + formatCurrency(r.adjustments));
    setText('bk-agi', 'Adjusted Gross Income (AGI)', formatCurrency(r.agi));

    const deductionLabel = r.deductionType === 'itemized' ? 'Itemized Deduction' : 'Standard Deduction';
    setText('bk-deduction', deductionLabel, '-' + formatCurrency(r.deduction));
    setText('bk-qbi', 'QBI Deduction', '-' + formatCurrency(r.qbiDeduction));
    document.getElementById('bk-qbi').style.display = r.qbiDeduction > 0 ? 'flex' : 'none';

    setText('bk-taxable-income', 'Taxable Income', formatCurrency(r.taxableIncome));

    const bracketContainer = document.getElementById('bracket-rows');
    bracketContainer.innerHTML = '';
    r.bracketDetails.forEach(b => {
        const row = document.createElement('div');
        row.className = 'breakdown-row bracket-row';
        const maxLabel = b.max === Infinity ? '+' : formatCurrency(b.max);
        row.innerHTML = '<span>' + (b.rate * 100).toFixed(0) + '% on ' + formatCurrency(b.income) + '</span><span>' + formatCurrency(b.tax) + '</span>';
        bracketContainer.appendChild(row);
    });

    setText('bk-income-tax', 'Income Tax (before credits)', formatCurrency(r.incomeTax));
    setText('bk-se-tax', 'Self-Employment Tax', formatCurrency(r.seTax));
    document.getElementById('bk-se-tax').style.display = r.seTax > 0 ? 'flex' : 'none';
    setText('bk-ltcg-tax', 'Long-Term Capital Gains Tax', formatCurrency(r.ltcgTax));
    document.getElementById('bk-ltcg-tax').style.display = r.ltcgTax > 0 ? 'flex' : 'none';
    setText('bk-niit', 'Net Investment Income Tax (3.8%)', formatCurrency(r.niit));
    document.getElementById('bk-niit').style.display = r.niit > 0 ? 'flex' : 'none';

    const creditsRow = document.getElementById('bk-credits');
    creditsRow.querySelector('span:last-child').textContent = '-' + formatCurrency(r.totalCredits);
    creditsRow.querySelector('span:last-child').className = 'credit-amount';

    setText('bk-total-tax', 'Total Federal Tax', formatCurrency(r.totalTax));
    setText('bk-marginal-rate', 'Marginal Tax Rate', (r.marginalRate * 100).toFixed(0) + '%');
    setText('bk-effective-rate', 'Effective Tax Rate', r.effectiveRate.toFixed(1) + '%');

    updateBracketChart(r);
}

function setText(id, label, value) {
    const el = document.getElementById(id);
    el.querySelector('span:first-child').textContent = label;
    el.querySelector('span:last-child').textContent = value;
}

function updateBracketChart(r) {
    const chart = document.getElementById('bracket-chart');
    chart.innerHTML = '';

    if (r.bracketDetails.length === 0) return;

    const maxIncome = Math.max(...r.bracketDetails.map(b => b.income));

    r.bracketDetails.forEach(b => {
        const row = document.createElement('div');
        row.className = 'bracket-bar-row';

        const label = document.createElement('span');
        label.className = 'bracket-rate-label';
        label.textContent = (b.rate * 100).toFixed(0) + '%';

        const bar = document.createElement('div');
        bar.className = 'bracket-bar rate-' + (b.rate * 100).toFixed(0);
        const width = maxIncome > 0 ? Math.max(2, (b.income / maxIncome) * 100) : 0;
        bar.style.width = width + '%';
        bar.textContent = formatCurrency(b.tax);

        row.appendChild(label);
        row.appendChild(bar);
        chart.appendChild(row);
    });
}
