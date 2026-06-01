const TAX_DATA = {
    year: 2025,
    brackets: {
        married_jointly: [
            { min: 0, max: 23850, rate: 0.10 },
            { min: 23850, max: 96950, rate: 0.12 },
            { min: 96950, max: 206700, rate: 0.22 },
            { min: 206700, max: 394600, rate: 0.24 },
            { min: 394600, max: 501050, rate: 0.32 },
            { min: 501050, max: 751600, rate: 0.35 },
            { min: 751600, max: Infinity, rate: 0.37 }
        ],
        single: [
            { min: 0, max: 11925, rate: 0.10 },
            { min: 11925, max: 48475, rate: 0.12 },
            { min: 48475, max: 103350, rate: 0.22 },
            { min: 103350, max: 197300, rate: 0.24 },
            { min: 197300, max: 250525, rate: 0.32 },
            { min: 250525, max: 626350, rate: 0.35 },
            { min: 626350, max: Infinity, rate: 0.37 }
        ],
        married_separately: [
            { min: 0, max: 11925, rate: 0.10 },
            { min: 11925, max: 48475, rate: 0.12 },
            { min: 48475, max: 103350, rate: 0.22 },
            { min: 103350, max: 197300, rate: 0.24 },
            { min: 197300, max: 250525, rate: 0.32 },
            { min: 250525, max: 375800, rate: 0.35 },
            { min: 375800, max: Infinity, rate: 0.37 }
        ],
        head_of_household: [
            { min: 0, max: 17000, rate: 0.10 },
            { min: 17000, max: 64850, rate: 0.12 },
            { min: 64850, max: 103350, rate: 0.22 },
            { min: 103350, max: 197300, rate: 0.24 },
            { min: 197300, max: 250500, rate: 0.32 },
            { min: 250500, max: 626350, rate: 0.35 },
            { min: 626350, max: Infinity, rate: 0.37 }
        ]
    },
    standardDeduction: {
        married_jointly: 30000,
        single: 15000,
        married_separately: 15000,
        head_of_household: 22500
    },
    ltcgBrackets: {
        married_jointly: [
            { min: 0, max: 96700, rate: 0.00 },
            { min: 96700, max: 600050, rate: 0.15 },
            { min: 600050, max: Infinity, rate: 0.20 }
        ],
        single: [
            { min: 0, max: 48350, rate: 0.00 },
            { min: 48350, max: 533400, rate: 0.15 },
            { min: 533400, max: Infinity, rate: 0.20 }
        ],
        married_separately: [
            { min: 0, max: 48350, rate: 0.00 },
            { min: 48350, max: 300025, rate: 0.15 },
            { min: 300025, max: Infinity, rate: 0.20 }
        ],
        head_of_household: [
            { min: 0, max: 64750, rate: 0.00 },
            { min: 64750, max: 566700, rate: 0.15 },
            { min: 566700, max: Infinity, rate: 0.20 }
        ]
    },
    niitThreshold: {
        married_jointly: 250000,
        single: 200000,
        married_separately: 125000,
        head_of_household: 200000
    },
    ctcPhaseout: {
        married_jointly: 400000,
        single: 200000,
        married_separately: 200000,
        head_of_household: 200000
    },
    eitc: {
        married_jointly: {
            0: { max_credit: 649, phaseout_start: 17850, phaseout_end: 19104 },
            1: { max_credit: 4328, phaseout_start: 29640, phaseout_end: 55768 },
            2: { max_credit: 7152, phaseout_start: 29640, phaseout_end: 61559 },
            3: { max_credit: 8046, phaseout_start: 29640, phaseout_end: 65078 }
        },
        other: {
            0: { max_credit: 649, phaseout_start: 11150, phaseout_end: 19104 },
            1: { max_credit: 4328, phaseout_start: 23050, phaseout_end: 49622 },
            2: { max_credit: 7152, phaseout_start: 23050, phaseout_end: 55529 },
            3: { max_credit: 8046, phaseout_start: 23050, phaseout_end: 59048 }
        },
        investment_income_limit: 11950
    },
    seTaxRate: 0.1530,
    seDeductionRate: 0.9235,
    additionalMedicareTax: {
        rate: 0.009,
        threshold: {
            married_jointly: 250000,
            single: 200000,
            married_separately: 125000,
            head_of_household: 200000
        }
    }
};

function calculateTax(inputs) {
    const status = inputs.filingStatus;
    const brackets = TAX_DATA.brackets[status];
    const stdDeduction = TAX_DATA.standardDeduction[status];

    const wages = inputs.wages1 + inputs.wages2;
    const seNet = Math.max(0, inputs.selfEmploymentIncome - inputs.selfEmploymentExpenses);
    const seTaxableIncome = seNet * TAX_DATA.seDeductionRate;
    const investmentIncome = inputs.interestIncome + inputs.dividendIncome + inputs.shortTermGains + inputs.longTermGains;

    const grossIncome = wages + seNet + inputs.interestIncome + inputs.shortTermGains + inputs.otherIncome;
    const grossIncomeWithLTCG = grossIncome + inputs.longTermGains + inputs.dividendIncome;

    const seTax = seTaxableIncome * TAX_DATA.seTaxRate;
    const seDeduction = seTax / 2;

    const trad401k = inputs.traditional401k + inputs.spouse401k;
    const tradIRA = inputs.traditionalIRA + inputs.spouseIRA;

    const adjustments = seDeduction
        + Math.min(inputs.studentLoanInterest, 2500)
        + inputs.hsaContribution
        + Math.min(inputs.educatorExpenses, 300)
        + trad401k
        + tradIRA;

    const agi = Math.max(0, grossIncomeWithLTCG - adjustments);
    const ordinaryAGI = Math.max(0, grossIncome - adjustments);

    let itemizedTotal = 0;
    if (inputs.deductionType === 'itemized') {
        const saltCapped = Math.min(inputs.saltDeduction, 10000);
        const medicalFloor = agi * 0.075;
        const medicalDeduction = Math.max(0, inputs.medicalExpenses - medicalFloor);
        itemizedTotal = inputs.mortgageInterest + saltCapped + inputs.charitableCash + inputs.charitableNonCash + medicalDeduction + inputs.otherItemized;
    }

    const deduction = inputs.deductionType === 'itemized' ? itemizedTotal : stdDeduction;
    const useItemized = itemizedTotal > stdDeduction;
    const actualDeduction = inputs.deductionType === 'itemized' ? itemizedTotal : stdDeduction;

    let qbiDeduction = 0;
    if (seNet > 0) {
        qbiDeduction = Math.min(seNet * 0.20, (agi - actualDeduction) * 0.20);
        qbiDeduction = Math.max(0, qbiDeduction);
    }

    const ordinaryTaxableIncome = Math.max(0, ordinaryAGI - actualDeduction - qbiDeduction);

    let taxableIncomeForBrackets = ordinaryTaxableIncome;
    const bracketDetails = [];
    let incomeTax = 0;
    let marginalRate = 0;

    for (const bracket of brackets) {
        const taxableInBracket = Math.max(0, Math.min(taxableIncomeForBrackets, bracket.max) - bracket.min);
        if (taxableInBracket > 0) {
            const tax = taxableInBracket * bracket.rate;
            incomeTax += tax;
            marginalRate = bracket.rate;
            bracketDetails.push({
                rate: bracket.rate,
                income: taxableInBracket,
                tax: tax,
                min: bracket.min,
                max: bracket.max
            });
        }
    }

    const ltcgBrackets = TAX_DATA.ltcgBrackets[status];
    let ltcgTax = 0;
    const ltcgIncome = inputs.longTermGains + inputs.dividendIncome;
    if (ltcgIncome > 0) {
        const baseIncome = ordinaryTaxableIncome;
        for (const bracket of ltcgBrackets) {
            const bracketStart = Math.max(0, bracket.min - baseIncome);
            const bracketEnd = Math.max(0, bracket.max - baseIncome);
            const taxableInBracket = Math.min(ltcgIncome, bracketEnd) - Math.min(ltcgIncome, bracketStart);
            if (taxableInBracket > 0) {
                ltcgTax += taxableInBracket * bracket.rate;
            }
        }
    }

    const niitThreshold = TAX_DATA.niitThreshold[status];
    let niit = 0;
    if (agi > niitThreshold) {
        const niitBase = Math.min(investmentIncome, agi - niitThreshold);
        niit = Math.max(0, niitBase) * 0.038;
    }

    const numChildren = inputs.numDependents;
    const ctcPerChild = 2000;
    const ctcPhaseout = TAX_DATA.ctcPhaseout[status];
    let ctc = numChildren * ctcPerChild;
    if (agi > ctcPhaseout) {
        const reduction = Math.ceil((agi - ctcPhaseout) / 1000) * 50;
        ctc = Math.max(0, ctc - reduction);
    }

    const otherDependentCredit = inputs.numOtherDependents * 500;
    ctc += otherDependentCredit;

    let cdcc = 0;
    if (inputs.dependentCareExpenses > 0 && wages > 0) {
        const maxExpenses = numChildren >= 2 ? 6000 : 3000;
        const qualifyingExpenses = Math.min(inputs.dependentCareExpenses, maxExpenses);
        let cdccRate = 0.20;
        if (agi <= 15000) cdccRate = 0.35;
        else if (agi <= 43000) cdccRate = 0.35 - Math.floor((agi - 15000) / 2000) * 0.01;
        else cdccRate = 0.20;
        cdcc = qualifyingExpenses * cdccRate;
    }

    let eitc = 0;
    const eitcChildren = Math.min(numChildren, 3);
    const eitcTable = status === 'married_jointly' ? TAX_DATA.eitc.married_jointly : TAX_DATA.eitc.other;
    const eitcParams = eitcTable[eitcChildren];
    if (investmentIncome <= TAX_DATA.eitc.investment_income_limit && eitcParams) {
        const earnedIncome = wages + seNet;
        if (earnedIncome > 0 && agi <= eitcParams.phaseout_end) {
            if (agi <= eitcParams.phaseout_start) {
                eitc = eitcParams.max_credit;
            } else {
                const reduction = (agi - eitcParams.phaseout_start) * (eitcParams.max_credit / (eitcParams.phaseout_end - eitcParams.phaseout_start));
                eitc = Math.max(0, eitcParams.max_credit - reduction);
            }
        }
    }

    let aoc = 0;
    if (inputs.educationExpenses > 0 && inputs.numStudents > 0) {
        const perStudent = Math.min(inputs.educationExpenses / inputs.numStudents, 4000);
        const creditPerStudent = Math.min(perStudent, 2000) + Math.max(0, perStudent - 2000) * 0.25;
        aoc = creditPerStudent * inputs.numStudents;
        const aocPhaseout = status === 'married_jointly' ? 160000 : 80000;
        const aocPhaseoutEnd = status === 'married_jointly' ? 180000 : 90000;
        if (agi > aocPhaseout) {
            const reduction = (agi - aocPhaseout) / (aocPhaseoutEnd - aocPhaseout);
            aoc = Math.max(0, aoc * (1 - Math.min(1, reduction)));
        }
    }

    const evCredit = Math.min(inputs.evCredit, 7500);
    const energyCredit = inputs.energyCredit;
    const otherCredits = evCredit + energyCredit;

    const totalCredits = ctc + cdcc + eitc + aoc + otherCredits;

    const taxBeforeCredits = incomeTax + ltcgTax + niit;
    const nonRefundableCreditLimit = taxBeforeCredits;
    const refundableCredits = Math.min(ctc, numChildren * 1700) + (aoc * 0.40) + eitc;
    const nonRefundableCredits = Math.min(totalCredits - refundableCredits, nonRefundableCreditLimit);

    const totalTax = Math.max(0, taxBeforeCredits - nonRefundableCredits) + seTax - refundableCredits;
    const finalTax = Math.max(0, totalTax);

    const effectiveRate = grossIncomeWithLTCG > 0 ? (finalTax / grossIncomeWithLTCG) * 100 : 0;

    const totalPaid = inputs.federalWithheld + inputs.estimatedPayments;
    const refundOrOwe = totalPaid - finalTax;

    const takeHome = grossIncomeWithLTCG - finalTax - trad401k - tradIRA
        - inputs.roth401k - inputs.spouseRoth401k
        - inputs.rothIRA - inputs.spouseRothIRA
        - inputs.hsaContribution;

    const trad401kSavings = trad401k * marginalRate;
    const tradIRASavings = tradIRA * marginalRate;

    return {
        grossIncome: grossIncomeWithLTCG,
        adjustments,
        agi,
        deduction: actualDeduction,
        deductionType: inputs.deductionType,
        itemizedTotal,
        standardDeduction: stdDeduction,
        useItemized,
        qbiDeduction,
        taxableIncome: ordinaryTaxableIncome + ltcgIncome,
        ordinaryTaxableIncome,
        incomeTax,
        ltcgTax,
        seTax,
        niit,
        bracketDetails,
        marginalRate,
        effectiveRate,
        ctc,
        cdcc,
        eitc,
        aoc,
        otherCredits,
        totalCredits,
        totalTax: finalTax,
        takeHome,
        refundOrOwe,
        totalPaid,
        trad401kSavings,
        tradIRASavings
    };
}
