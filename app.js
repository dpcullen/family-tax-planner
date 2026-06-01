let currentLocation = 'us';

document.addEventListener('DOMContentLoaded', () => {
    initLocationToggle();
    initSituationToggle();
    initCurrencyInputs();
    attachListeners();
    recalculate();
});

function initLocationToggle() {
    document.querySelectorAll('.loc-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.loc-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentLocation = btn.dataset.location;
            document.querySelectorAll('.ca-only').forEach(el => {
                el.classList.toggle('hidden', currentLocation !== 'ca');
            });
            recalculate();
        });
    });
}

function initSituationToggle() {
    const header = document.getElementById('situation-toggle');
    const body = document.getElementById('situation-body');
    header.addEventListener('click', () => {
        header.classList.toggle('collapsed');
        body.classList.toggle('collapsed');
    });
}

function initCurrencyInputs() {
    document.querySelectorAll('.currency-input').forEach(input => {
        input.addEventListener('focus', () => {
            const raw = input.value.replace(/[^0-9.]/g, '');
            input.value = raw === '0' ? '' : raw;
        });
        input.addEventListener('blur', () => {
            const raw = input.value.replace(/[^0-9.]/g, '');
            input.value = fmt(parseFloat(raw) || 0);
        });
        input.addEventListener('input', () => {
            const pos = input.selectionStart;
            input.value = input.value.replace(/[^0-9.]/g, '');
            recalculate();
        });
        input.value = fmt(parseFloat(input.value) || 0);
    });
}

function attachListeners() {
    document.querySelectorAll('input, select').forEach(el => {
        el.addEventListener('change', recalculate);
        if (el.type === 'number') el.addEventListener('input', recalculate);
    });
}

function val(id) {
    const el = document.getElementById(id);
    return parseFloat((el?.value || '0').replace(/[^0-9.]/g, '')) || 0;
}

function intVal(id) {
    return parseInt(document.getElementById(id)?.value) || 0;
}

function fmt(n) {
    return Math.round(n).toLocaleString('en-US');
}

function fmtC(n) {
    const sym = currentLocation === 'ca' ? 'C$' : '$';
    return (n < 0 ? '-' : '') + sym + fmt(Math.abs(n));
}

function recalculate() {
    const income = val('household-income');
    const spouseIncome = val('spouse-income');
    const numChildren = intVal('num-children');
    const age = intVal('your-age');
    const matchPct = val('employer-match') / 100;
    const matchCap = val('match-cap') / 100;
    const hasHDHP = document.getElementById('has-hdhp').value === 'yes';
    const hasMegaBackdoor = document.getElementById('has-mega-backdoor').value === 'yes';
    const isFirstHomeBuyer = document.getElementById('is-first-home-buyer').value === 'yes';
    const timeline = document.getElementById('risk-tolerance').value;

    const ctx = { income, spouseIncome, numChildren, age, matchPct, matchCap, hasHDHP, hasMegaBackdoor, isFirstHomeBuyer, timeline };

    if (currentLocation === 'us') {
        renderUS(ctx);
    } else {
        renderCA(ctx);
    }
}

// ─── US RENDERING ───

function renderUS(ctx) {
    const d = TAX.us;
    const marginalRate = getMarginalRate(ctx.income - d.standardDeduction, d.brackets);
    const vehicles = d.vehicles;

    const yourContribution = ctx.income * ctx.matchCap;
    const matchAmount = Math.min(yourContribution * ctx.matchPct, ctx.income * ctx.matchCap * ctx.matchPct);
    const megaSpace = ctx.hasMegaBackdoor ? Math.max(0, vehicles.trad401k.totalLimit - vehicles.trad401k.limit - matchAmount) : 0;

    const shelterSpace = vehicles.trad401k.limit
        + vehicles.rothIRA.limit * 2
        + (ctx.hasHDHP ? vehicles.hsa.limit : 0)
        + (ctx.hasMegaBackdoor ? megaSpace : 0);

    const potentialSavings = vehicles.trad401k.limit * marginalRate
        + (ctx.hasHDHP ? vehicles.hsa.limit * marginalRate : 0);

    document.getElementById('marginal-rate').textContent = (marginalRate * 100).toFixed(0) + '%';
    document.getElementById('marginal-detail').textContent = 'Federal (WA has no state income tax)';
    document.getElementById('total-shelter').textContent = fmtC(shelterSpace);
    document.getElementById('shelter-detail').textContent = 'Annual tax-advantaged space';
    document.getElementById('potential-savings').textContent = fmtC(potentialSavings);
    document.getElementById('free-money').textContent = fmtC(matchAmount);
    document.getElementById('free-money-detail').textContent = 'Employer 401(k) match';

    renderPriority(buildUSPriority(ctx, d, marginalRate, matchAmount, megaSpace));
    renderVehicles(d.vehicles, ctx, 'us', marginalRate);
    renderCompareDropdowns(d.vehicles);
    renderTaxEstimate(ctx, 'us');
}

function buildUSPriority(ctx, d, marginalRate, matchAmount, megaSpace) {
    const steps = [];
    const v = d.vehicles;

    if (matchAmount > 0) {
        steps.push({
            name: '401(k) up to employer match',
            reason: 'This is free money — ' + (ctx.matchPct * 100) + '% match on your contributions. Always max this first.',
            amount: fmtC(Math.min(ctx.income * ctx.matchCap, v.trad401k.limit))
        });
    }

    if (ctx.hasHDHP) {
        steps.push({
            name: 'Max your HSA',
            reason: 'Triple-tax-free. The single best tax vehicle in the US. Invest it and let it grow.',
            amount: fmtC(v.hsa.limit)
        });
    }

    steps.push({
        name: 'Max Roth IRA (both spouses)',
        reason: ctx.income > v.rothIRA.incomePhaseout.end
            ? 'Your income exceeds the limit — use the Backdoor Roth strategy.'
            : 'Tax-free growth forever. Flexible withdrawals. No RMDs.',
        amount: fmtC(v.rothIRA.limit * 2)
    });

    steps.push({
        name: 'Max 401(k) to full employee limit',
        reason: marginalRate >= 0.24
            ? 'At your ' + (marginalRate * 100) + '% rate, the tax deduction is very valuable. Consider Traditional.'
            : 'Consider Roth 401(k) at your ' + (marginalRate * 100) + '% rate — pay tax now at a lower rate.',
        amount: fmtC(v.trad401k.limit)
    });

    if (ctx.numChildren > 0) {
        steps.push({
            name: '529 for each child',
            reason: 'Tax-free growth for education. Start early for maximum compounding. Helps reduce WA estate tax exposure.',
            amount: fmtC(ctx.numChildren * 10000) + '+/yr suggested'
        });
    }

    if (ctx.hasMegaBackdoor && megaSpace > 0) {
        steps.push({
            name: 'Mega Backdoor Roth',
            reason: 'After maxing everything else, shelter up to ' + fmtC(megaSpace) + ' more in Roth. Enormous long-term benefit.',
            amount: fmtC(megaSpace)
        });
    }

    if (ctx.income > 500000) {
        steps.push({
            name: 'Consider irrevocable trust',
            reason: 'WA estate tax starts at $3M — much lower than federal. Start planning early to shift assets out of your estate.',
            amount: 'Consult attorney'
        });
    }

    return steps;
}

// ─── CANADA RENDERING ───

function renderCA(ctx) {
    const d = TAX.ca;
    const fedRate = getMarginalRate(ctx.income - d.federalPersonalAmount, d.federalBrackets);
    const provRate = getMarginalRate(ctx.income - d.provincialPersonalAmount, d.provincialBrackets);
    const combinedRate = fedRate + provRate;

    const vehicles = d.vehicles;
    const rrspLimit = Math.min(ctx.income * vehicles.rrsp.limitPercent, vehicles.rrsp.limit);
    const cesgPerChild = vehicles.resp.cesgMax;
    const totalCESG = cesgPerChild * ctx.numChildren;

    const shelterSpace = rrspLimit + vehicles.tfsa.limit * 2
        + (ctx.isFirstHomeBuyer ? vehicles.fhsa.limit : 0)
        + vehicles.resp.limit * ctx.numChildren;

    const potentialSavings = rrspLimit * combinedRate
        + (ctx.isFirstHomeBuyer ? vehicles.fhsa.limit * combinedRate : 0);

    document.getElementById('marginal-rate').textContent = (combinedRate * 100).toFixed(1) + '%';
    document.getElementById('marginal-detail').textContent = 'Federal ' + (fedRate * 100).toFixed(1) + '% + BC ' + (provRate * 100).toFixed(1) + '%';
    document.getElementById('total-shelter').textContent = fmtC(shelterSpace);
    document.getElementById('shelter-detail').textContent = 'Annual tax-advantaged space';
    document.getElementById('potential-savings').textContent = fmtC(potentialSavings);
    document.getElementById('free-money').textContent = fmtC(totalCESG);
    document.getElementById('free-money-detail').textContent = 'CESG grants (' + fmtC(cesgPerChild) + '/child)';

    renderPriority(buildCAPriority(ctx, d, combinedRate, rrspLimit, totalCESG));
    renderVehicles(d.vehicles, ctx, 'ca', combinedRate);
    renderCompareDropdowns(d.vehicles);
    renderTaxEstimate(ctx, 'ca');
}

function buildCAPriority(ctx, d, combinedRate, rrspLimit, totalCESG) {
    const steps = [];
    const v = d.vehicles;

    if (ctx.numChildren > 0) {
        steps.push({
            name: 'RESP — $2,500/child/year',
            reason: 'Free 20% government match (CESG). Instant guaranteed return of ' + fmtC(totalCESG) + '/year. Don\'t leave free money on the table.',
            amount: fmtC(v.resp.limit * ctx.numChildren) + ' → get ' + fmtC(totalCESG) + ' free'
        });
    }

    if (ctx.isFirstHomeBuyer) {
        steps.push({
            name: 'Max FHSA',
            reason: 'Double tax benefit: deduction now + tax-free withdrawal for home. The best deal in Canadian tax law.',
            amount: fmtC(v.fhsa.limit)
        });
    }

    if (combinedRate >= 0.29) {
        steps.push({
            name: 'Max RRSP',
            reason: 'At your ' + (combinedRate * 100).toFixed(1) + '% combined rate, the deduction saves you ' + fmtC(rrspLimit * combinedRate) + ' in taxes.',
            amount: fmtC(rrspLimit)
        });
        steps.push({
            name: 'Max TFSA (both spouses)',
            reason: 'After RRSP, shelter more in TFSA. Completely flexible — withdraw anytime, tax-free, for any reason.',
            amount: fmtC(v.tfsa.limit * 2)
        });
    } else {
        steps.push({
            name: 'Max TFSA (both spouses)',
            reason: 'At your ' + (combinedRate * 100).toFixed(1) + '% rate, TFSA may be better than RRSP — no deduction to "waste" at a low rate, and all growth is permanently tax-free.',
            amount: fmtC(v.tfsa.limit * 2)
        });
        steps.push({
            name: 'RRSP contributions',
            reason: 'Still valuable, but consider whether your future tax rate might be higher. You can also carry forward room to use when your income is higher.',
            amount: fmtC(rrspLimit)
        });
    }

    if (ctx.income > 300000) {
        steps.push({
            name: 'Consider family trust',
            reason: 'Income splitting with adult family members. Estate planning and probate avoidance. Consult a tax professional.',
            amount: 'Consult advisor'
        });
    }

    return steps;
}

// ─── SHARED RENDERING ───

function getMarginalRate(taxableIncome, brackets) {
    let rate = 0;
    for (const b of brackets) {
        if (taxableIncome > b.min) rate = b.rate;
    }
    return rate;
}

function calculateTax(income, brackets, personalAmount) {
    const taxable = Math.max(0, income - (personalAmount || 0));
    let tax = 0;
    for (const b of brackets) {
        const inBracket = Math.max(0, Math.min(taxable, b.max) - b.min);
        if (inBracket > 0) tax += inBracket * b.rate;
    }
    return tax;
}

function renderPriority(steps) {
    const container = document.getElementById('priority-steps');
    container.innerHTML = steps.map((s, i) => `
        <div class="priority-step">
            <div class="step-number">${i + 1}</div>
            <div class="step-content">
                <div class="step-name">${s.name}</div>
                <div class="step-reason">${s.reason}</div>
            </div>
            <div class="step-amount">${s.amount}</div>
        </div>
    `).join('');
}

function getVehicleBadge(id, ctx, loc, marginalRate) {
    if (loc === 'us') {
        if (id === 'hsa' && !ctx.hasHDHP) return { cls: 'badge-not-available', text: 'Need HDHP' };
        if (id === 'hsa' && ctx.hasHDHP) return { cls: 'badge-top-priority', text: 'Top Priority' };
        if (id === 'megaBackdoor' && !ctx.hasMegaBackdoor) return { cls: 'badge-not-available', text: 'Check Plan' };
        if (id === 'megaBackdoor' && ctx.hasMegaBackdoor) return { cls: 'badge-great-fit', text: 'Great Fit' };
        if (id === 'trad401k') return marginalRate >= 0.24 ? { cls: 'badge-top-priority', text: 'Top Priority' } : { cls: 'badge-great-fit', text: 'Great Fit' };
        if (id === 'roth401k') return marginalRate < 0.24 ? { cls: 'badge-top-priority', text: 'Top Priority' } : { cls: 'badge-great-fit', text: 'Great Fit' };
        if (id === 'rothIRA') return { cls: 'badge-top-priority', text: 'Top Priority' };
        if (id === 'tradIRA') {
            if (ctx.income > 146000) return { cls: 'badge-consider', text: 'Limited Use' };
            return { cls: 'badge-good-option', text: 'Good Option' };
        }
        if (id === 'plan529' && ctx.numChildren > 0) return { cls: 'badge-great-fit', text: 'Great Fit' };
        if (id === 'plan529') return { cls: 'badge-consider', text: 'Consider' };
        if (id === 'utma') return { cls: 'badge-consider', text: 'Consider' };
        if (id === 'irrevocableTrust') return ctx.income > 300000 ? { cls: 'badge-advanced', text: 'Advanced' } : { cls: 'badge-consider', text: 'Consider' };
        if (id === 'revocableTrust') return { cls: 'badge-good-option', text: 'Good Option' };
    } else {
        if (id === 'fhsa' && !ctx.isFirstHomeBuyer) return { cls: 'badge-not-available', text: 'Not Eligible' };
        if (id === 'fhsa' && ctx.isFirstHomeBuyer) return { cls: 'badge-top-priority', text: 'Top Priority' };
        if (id === 'resp' && ctx.numChildren > 0) return { cls: 'badge-top-priority', text: 'Top Priority' };
        if (id === 'resp') return { cls: 'badge-not-available', text: 'No Children' };
        if (id === 'tfsa') return { cls: 'badge-top-priority', text: 'Top Priority' };
        if (id === 'rrsp') return marginalRate >= 0.29 ? { cls: 'badge-top-priority', text: 'Top Priority' } : { cls: 'badge-great-fit', text: 'Great Fit' };
        if (id === 'familyTrust') return ctx.income > 300000 ? { cls: 'badge-advanced', text: 'Advanced' } : { cls: 'badge-consider', text: 'Consider' };
        if (id === 'bareTrust') return { cls: 'badge-consider', text: 'Consider' };
    }
    return { cls: 'badge-good-option', text: 'Good Option' };
}

function getPersonalizedRec(v, ctx, loc, marginalRate) {
    const id = v.id;
    if (loc === 'us') {
        if (id === 'trad401k') {
            if (marginalRate >= 0.32) return { type: '', text: 'At your ' + (marginalRate * 100) + '% marginal rate, Traditional 401(k) saves you ' + fmtC(v.limit * marginalRate) + '/year in taxes. Strong choice for you.' };
            if (marginalRate >= 0.22) return { type: '', text: 'At ' + (marginalRate * 100) + '%, you\'re in a middle ground. Consider splitting between Traditional (tax break now) and Roth (tax-free later). In WA with no state tax, Roth is relatively more attractive.' };
            return { type: 'info', text: 'At your ' + (marginalRate * 100) + '% rate, the deduction isn\'t as valuable. Consider Roth 401(k) instead — you\'re paying less tax now, so lock in the low rate and get tax-free growth.' };
        }
        if (id === 'roth401k') {
            if (marginalRate <= 0.22) return { type: '', text: 'Strong choice at your ' + (marginalRate * 100) + '% rate. Pay a small amount of tax now, and everything — contributions AND growth — is tax-free forever.' };
            if (marginalRate >= 0.32) return { type: 'info', text: 'At ' + (marginalRate * 100) + '%, you\'re paying a premium for Roth. Traditional saves more today, but Roth protects against future tax increases. Consider splitting.' };
            return { type: '', text: 'Good balance at your rate. If you think taxes will be higher when you retire (many experts predict this), Roth gives you certainty.' };
        }
        if (id === 'megaBackdoor') {
            if (!ctx.hasMegaBackdoor) return { type: 'warning', text: 'Check with your HR department if your 401(k) plan allows after-tax contributions AND in-plan Roth conversions (or in-service distributions). Not all plans offer this. If yours does, this is one of the most powerful wealth-building tools available.' };
            const matchAmt = Math.min(ctx.income * ctx.matchCap, ctx.income) * ctx.matchPct;
            const space = Math.max(0, v.totalLimit - v.limit - matchAmt);
            return { type: '', text: 'Your plan allows it! After your $23,500 deferral and ~' + fmtC(matchAmt) + ' employer match, you have approximately ' + fmtC(space) + ' of mega backdoor space. That\'s ' + fmtC(space) + ' more in tax-free Roth every year.' };
        }
        if (id === 'rothIRA') {
            if (ctx.income > v.incomePhaseout.end) return { type: 'info', text: 'Your income exceeds the ' + fmtC(v.incomePhaseout.end) + ' Roth IRA limit. Use the Backdoor Roth strategy: contribute $7,000 to a non-deductible Traditional IRA, then immediately convert to Roth. Legal and widely used. Make sure you don\'t have existing pre-tax IRA balances (pro-rata rule).' };
            if (ctx.income > v.incomePhaseout.start) return { type: 'warning', text: 'Your income is in the phase-out zone (' + fmtC(v.incomePhaseout.start) + '-' + fmtC(v.incomePhaseout.end) + '). Your contribution limit is reduced. Consider the Backdoor Roth to get the full $7,000.' };
            return { type: '', text: 'You\'re eligible for the full ' + fmtC(v.limit * 2) + '/year (both spouses). This should be one of your top priorities — flexible, tax-free, no RMDs.' };
        }
        if (id === 'hsa') {
            if (!ctx.hasHDHP) return { type: 'warning', text: 'You need a High Deductible Health Plan to contribute to an HSA. During your next open enrollment, evaluate whether an HDHP makes sense for your family. The triple tax benefit is unmatched — it\'s often worth the higher deductible.' };
            return { type: '', text: 'At your ' + (marginalRate * 100) + '% rate, maxing your HSA saves ' + fmtC(v.limit * marginalRate) + ' in taxes immediately, plus all growth and medical withdrawals are tax-free. Pro tip: pay medical bills out-of-pocket, invest the HSA, and reimburse yourself decades later for maximum growth.' };
        }
        if (id === 'plan529') {
            if (ctx.numChildren === 0) return { type: 'info', text: 'You can still open a 529 for a future child, niece, nephew, or even yourself. The beneficiary can be changed later.' };
            return { type: '', text: 'With ' + ctx.numChildren + ' child(ren), 529s give you tax-free growth for education. In WA, this also helps with estate planning — the $3M WA estate tax threshold is much lower than federal. The 529-to-Roth rollover (up to $35K per child, after 15 years) is a great safety valve if they get scholarships.' };
        }
        if (id === 'irrevocableTrust') {
            if (ctx.income > 300000) return { type: '', text: 'With your income level, your estate may approach WA\'s $3M threshold relatively quickly. Start planning now — irrevocable trusts take time to set up and fund. Consult an estate planning attorney.' };
            return { type: 'info', text: 'WA has a uniquely low estate tax threshold ($3M). Even if this feels premature now, keep it on your radar as your wealth grows. Your home equity counts toward this threshold.' };
        }
    } else {
        if (id === 'rrsp') {
            const rrspLimit = Math.min(ctx.income * 0.18, v.limit);
            if (marginalRate >= 0.40) return { type: '', text: 'At your ' + (marginalRate * 100).toFixed(1) + '% combined rate, maxing your RRSP saves ' + fmtC(rrspLimit * marginalRate) + ' in taxes. A spousal RRSP contribution splits income in retirement, which is very powerful for couples with unequal incomes.' };
            if (marginalRate >= 0.29) return { type: '', text: 'Good return on the RRSP deduction at your rate. Your room is ' + fmtC(rrspLimit) + '. If your spouse earns less, consider spousal RRSP contributions to equalize retirement income.' };
            return { type: 'info', text: 'At your ' + (marginalRate * 100).toFixed(1) + '% rate, the RRSP deduction is less impactful. Consider whether your income (and rate) might be higher in a few years — if so, carry forward your room and deduct later at a higher rate. Prioritize TFSA in the meantime.' };
        }
        if (id === 'tfsa') {
            return { type: '', text: 'Max this every year — both spouses. That\'s ' + fmtC(v.limit * 2) + '/year of completely tax-free investment growth. Unlike RRSP, withdrawals never count as income, which protects government benefits like CCB (Canada Child Benefit). If you have unused room from prior years, catch up.' };
        }
        if (id === 'resp') {
            if (ctx.numChildren === 0) return { type: 'info', text: 'No children entered. Update your information above if you have children.' };
            return { type: '', text: 'With ' + ctx.numChildren + ' child(ren), contribute ' + fmtC(v.limit * ctx.numChildren) + '/year to get ' + fmtC(v.cesgMax * ctx.numChildren) + ' in free CESG grants. That\'s an instant 20% guaranteed return. Over 18 years, the CESG alone provides ' + fmtC(v.cesgLifetime * ctx.numChildren) + ' in free money for your kids\' education. If they don\'t go to school, you can roll the growth into your RRSP.' };
        }
        if (id === 'fhsa') {
            if (!ctx.isFirstHomeBuyer) return { type: 'warning', text: 'You indicated you\'re not a first-time buyer. If you haven\'t owned a home in the past 4 calendar years, you may qualify. The double-tax benefit (deduction + tax-free withdrawal) makes this the best home savings vehicle ever created in Canada.' };
            return { type: '', text: 'Open this account immediately if you haven\'t already — carry-forward room only accumulates after the account is opened. You get a deduction today (' + fmtC(v.limit * marginalRate) + ' savings at your rate) AND tax-free withdrawal for your home. You can combine this with the RRSP Home Buyers\' Plan ($60K) for up to $100K in tax-advantaged home savings.' };
        }
        if (id === 'familyTrust') {
            return { type: 'info', text: 'Family trusts are powerful but complex. Most useful when you have adult children, business income, or substantial investments. The TOSI rules have limited income splitting with minors. Canada has no estate tax, but the deemed disposition at death triggers capital gains — a trust can help manage this. Consult a tax professional.' };
        }
    }
    return null;
}

function renderVehicles(vehicles, ctx, loc, marginalRate) {
    const grid = document.getElementById('vehicles-grid');
    grid.innerHTML = '';

    for (const key of Object.keys(vehicles)) {
        const v = vehicles[key];
        const badge = getVehicleBadge(v.id, ctx, loc, marginalRate);
        const rec = getPersonalizedRec(v, ctx, loc, marginalRate);

        let limitDisplay = '';
        let limitLabelDisplay = '';
        if (v.limit) {
            if (v.id === 'rrsp') {
                const rrspRoom = Math.min(ctx.income * v.limitPercent, v.limit);
                limitDisplay = fmtC(rrspRoom);
                limitLabelDisplay = 'your 2025 room';
            } else if (v.id === 'resp') {
                limitDisplay = fmtC(v.limit * ctx.numChildren);
                limitLabelDisplay = '/yr for ' + ctx.numChildren + ' child(ren)';
            } else if (v.id === 'rothIRA' || v.id === 'tfsa') {
                limitDisplay = fmtC(v.limit * 2);
                limitLabelDisplay = '/yr (both spouses)';
            } else {
                limitDisplay = fmtC(v.limit);
                limitLabelDisplay = v.limitLabel;
            }
        } else if (v.id === 'megaBackdoor') {
            const matchAmt = Math.min(ctx.income * ctx.matchCap, ctx.income) * ctx.matchPct;
            const space = Math.max(0, (v.totalLimit || 70000) - 23500 - matchAmt);
            limitDisplay = fmtC(space);
            limitLabelDisplay = '/yr (varies by match)';
        } else {
            limitDisplay = 'No limit';
            limitLabelDisplay = '';
        }

        const card = document.createElement('div');
        card.className = 'vehicle-card';
        card.innerHTML = `
            <div class="vehicle-header" onclick="this.parentElement.classList.toggle('expanded')">
                <div class="vehicle-icon ${v.iconClass}">${v.icon}</div>
                <div class="vehicle-info">
                    <div class="vehicle-name">
                        ${v.name}
                        <span class="vehicle-badge ${badge.cls}">${badge.text}</span>
                    </div>
                    <div class="vehicle-oneliner">${v.oneliner}</div>
                </div>
                <div>
                    <div class="vehicle-limit">${limitDisplay}</div>
                    <div class="vehicle-limit-label">${limitLabelDisplay}</div>
                </div>
                <div class="vehicle-expand-arrow">&#9660;</div>
            </div>
            <div class="vehicle-body">
                <div class="vehicle-body-grid">
                    <div class="detail-block">
                        <h4>Tax Treatment</h4>
                        <ul>
                            <li><strong>Going in:</strong> ${v.taxContribution}</li>
                            <li><strong>Growth:</strong> ${v.taxGrowth}</li>
                            <li><strong>Coming out:</strong> ${v.taxWithdrawal}</li>
                        </ul>
                    </div>
                    <div class="detail-block">
                        <h4>Best For</h4>
                        <p>${v.bestFor}</p>
                    </div>
                    <div class="detail-block">
                        <h4>Advantages</h4>
                        <ul>${v.pros.map(p => `<li class="pro">${p}</li>`).join('')}</ul>
                    </div>
                    <div class="detail-block">
                        <h4>Drawbacks</h4>
                        <ul>${v.cons.map(c => `<li class="con">${c}</li>`).join('')}</ul>
                    </div>
                    <div class="detail-block full-width">
                        <h4>Important Details</h4>
                        <p>${v.gotchas}</p>
                    </div>
                    ${rec ? `<div class="recommendation-box ${rec.type}"><h4>Your Recommendation</h4><p>${rec.text}</p></div>` : ''}
                </div>
            </div>
        `;
        grid.appendChild(card);
    }
}

function renderCompareDropdowns(vehicles) {
    const keys = Object.keys(vehicles);
    const a = document.getElementById('compare-a');
    const b = document.getElementById('compare-b');

    const prevA = a.value;
    const prevB = b.value;

    a.innerHTML = keys.map(k => `<option value="${k}">${vehicles[k].name}</option>`).join('');
    b.innerHTML = keys.map(k => `<option value="${k}">${vehicles[k].name}</option>`).join('');

    if (prevA && keys.includes(prevA)) a.value = prevA;
    else a.value = keys[0];

    if (prevB && keys.includes(prevB)) b.value = prevB;
    else b.value = keys.length > 1 ? keys[1] : keys[0];

    a.onchange = () => renderCompare(vehicles);
    b.onchange = () => renderCompare(vehicles);

    renderCompare(vehicles);
}

function renderCompare(vehicles) {
    const aKey = document.getElementById('compare-a').value;
    const bKey = document.getElementById('compare-b').value;
    const va = vehicles[aKey];
    const vb = vehicles[bKey];

    const rows = [
        ['Contribution Tax', va.taxContribution, vb.taxContribution],
        ['Growth Tax', va.taxGrowth, vb.taxGrowth],
        ['Withdrawal Tax', va.taxWithdrawal, vb.taxWithdrawal],
        ['Annual Limit', va.limit ? fmtC(va.limit) : 'No limit', vb.limit ? fmtC(vb.limit) : 'No limit'],
        ['Required Distributions', va.rmd || 'N/A', vb.rmd || 'N/A'],
        ['Best For', va.bestFor, vb.bestFor]
    ];

    const container = document.getElementById('compare-table');
    container.innerHTML = `
        <table class="compare-grid">
            <thead>
                <tr>
                    <th>Feature</th>
                    <th>${va.name}</th>
                    <th>${vb.name}</th>
                </tr>
            </thead>
            <tbody>
                ${rows.map(r => `<tr><td><strong>${r[0]}</strong></td><td>${r[1]}</td><td>${r[2]}</td></tr>`).join('')}
            </tbody>
        </table>
    `;
}

function renderTaxEstimate(ctx, loc) {
    const container = document.getElementById('tax-estimate');

    if (loc === 'us') {
        const d = TAX.us;
        const gross = ctx.income;
        const deduction = d.standardDeduction;
        const taxable = Math.max(0, gross - deduction);
        const tax = calculateTax(gross, d.brackets, deduction);
        const ctc = Math.min(ctx.numChildren, 10) * 2000;
        const finalTax = Math.max(0, tax - ctc);
        const effective = gross > 0 ? (finalTax / gross * 100).toFixed(1) : '0.0';

        container.innerHTML = `
            <div class="estimate-row"><span>Gross Household Income</span><span>${fmtC(gross)}</span></div>
            <div class="estimate-row"><span>Standard Deduction (MFJ)</span><span class="negative">-${fmtC(deduction)}</span></div>
            <div class="estimate-row subtotal"><span>Taxable Income</span><span>${fmtC(taxable)}</span></div>
            <div class="estimate-row"><span>Federal Income Tax</span><span>${fmtC(tax)}</span></div>
            <div class="estimate-row"><span>Child Tax Credit (${ctx.numChildren} child${ctx.numChildren !== 1 ? 'ren' : ''})</span><span class="negative">-${fmtC(ctc)}</span></div>
            <div class="estimate-row total"><span>Estimated Federal Tax</span><span>${fmtC(finalTax)}</span></div>
            <div class="estimate-row"><span>Effective Tax Rate</span><span>${effective}%</span></div>
            <div class="estimate-row"><span>WA State Income Tax</span><span>${fmtC(0)} (no state income tax)</span></div>
            <div class="estimate-row subtotal"><span>Estimated Take-Home</span><span>${fmtC(gross - finalTax)}</span></div>
        `;
    } else {
        const d = TAX.ca;
        const gross = ctx.income;
        const fedTax = calculateTax(gross, d.federalBrackets, d.federalPersonalAmount);
        const provTax = calculateTax(gross, d.provincialBrackets, d.provincialPersonalAmount);
        const cpp = Math.min(4034 * 2, gross * 0.0595);
        const cpp2 = gross > 71300 ? Math.min(396 * 2, (Math.min(gross, 81200) - 71300) * 0.04) : 0;
        const ei = Math.min(1077 * 2, gross * 0.0164);
        const totalTax = fedTax + provTax + cpp + cpp2 + ei;
        const effective = gross > 0 ? (totalTax / gross * 100).toFixed(1) : '0.0';

        container.innerHTML = `
            <div class="estimate-row"><span>Gross Household Income</span><span>${fmtC(gross)}</span></div>
            <div class="estimate-row"><span>Federal Income Tax</span><span>${fmtC(fedTax)}</span></div>
            <div class="estimate-row"><span>BC Provincial Income Tax</span><span>${fmtC(provTax)}</span></div>
            <div class="estimate-row"><span>CPP Contributions (est.)</span><span>${fmtC(cpp + cpp2)}</span></div>
            <div class="estimate-row"><span>EI Premiums (est.)</span><span>${fmtC(ei)}</span></div>
            <div class="estimate-row total"><span>Estimated Total Tax & Deductions</span><span>${fmtC(totalTax)}</span></div>
            <div class="estimate-row"><span>Effective Rate (all-in)</span><span>${effective}%</span></div>
            <div class="estimate-row subtotal"><span>Estimated Take-Home</span><span>${fmtC(gross - totalTax)}</span></div>
        `;
    }
}
