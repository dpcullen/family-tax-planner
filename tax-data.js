const TAX = {
    us: {
        year: 2025,
        label: 'US (Washington State)',
        currency: 'USD',
        currencySymbol: '$',
        brackets: [
            { min: 0, max: 23850, rate: 0.10 },
            { min: 23850, max: 96950, rate: 0.12 },
            { min: 96950, max: 206700, rate: 0.22 },
            { min: 206700, max: 394600, rate: 0.24 },
            { min: 394600, max: 501050, rate: 0.32 },
            { min: 501050, max: 751600, rate: 0.35 },
            { min: 751600, max: Infinity, rate: 0.37 }
        ],
        standardDeduction: 30000,
        stateNotes: 'Washington has no state income tax. However, WA levies a 7% capital gains tax on long-term gains above $270,000 and has an estate tax starting at $3 million (much lower than the $13.99M federal exemption).',
        vehicles: {
            trad401k: {
                id: 'trad401k',
                name: 'Traditional 401(k)',
                icon: '🏦',
                iconClass: 'retirement',
                oneliner: 'Pre-tax retirement savings through your employer',
                limit: 23500,
                limitLabel: '/year employee limit',
                catchUp50: 7500,
                catchUp60: 11250,
                totalLimit: 70000,
                taxContribution: 'Pre-tax — reduces your taxable income today',
                taxGrowth: 'Tax-deferred — no taxes while it grows',
                taxWithdrawal: 'Taxed as ordinary income when you withdraw in retirement',
                rmd: 'Required at age 73',
                pros: [
                    'Immediate tax savings at your marginal rate',
                    'Employer match is essentially free money',
                    'High contribution limit ($23,500)',
                    'Reduces your AGI, which can help qualify for other tax breaks'
                ],
                cons: [
                    'You\'ll pay taxes on withdrawals in retirement',
                    'Required minimum distributions at 73',
                    '10% early withdrawal penalty before 59½',
                    'If you expect higher income later, you may pay more tax on withdrawals'
                ],
                bestFor: 'People who expect their tax rate in retirement to be lower than today',
                gotchas: 'Employer match always goes into pre-tax bucket regardless of your contribution type. Match does NOT count toward your $23,500 limit but DOES count toward the $70,000 total limit.'
            },
            roth401k: {
                id: 'roth401k',
                name: 'Roth 401(k)',
                icon: '🌟',
                iconClass: 'retirement',
                oneliner: 'After-tax retirement savings — tax-free in retirement',
                limit: 23500,
                limitLabel: '/year (shared with Traditional)',
                catchUp50: 7500,
                catchUp60: 11250,
                taxContribution: 'After-tax — no tax break today',
                taxGrowth: 'Tax-free',
                taxWithdrawal: 'Completely tax-free (if qualified)',
                rmd: 'No RMDs required (since 2024)',
                pros: [
                    'All withdrawals in retirement are 100% tax-free',
                    'No required minimum distributions — can let it grow forever',
                    'Great hedge against future tax rate increases',
                    'Tax-free inheritance for your kids'
                ],
                cons: [
                    'No tax break today — you pay full taxes on contributions now',
                    'Same contribution limit shared with Traditional 401(k)',
                    'If your tax rate drops in retirement, you "overpaid" taxes'
                ],
                bestFor: 'People who expect their tax rate in retirement to be the same or higher than today. Also great for younger workers with decades of tax-free growth ahead.',
                gotchas: 'You can split contributions between Traditional and Roth 401(k) — they share the $23,500 limit. In WA with no state income tax, the Roth is relatively more attractive because you\'re not "wasting" a state tax deduction by choosing Roth.'
            },
            megaBackdoor: {
                id: 'megaBackdoor',
                name: 'Mega Backdoor Roth',
                icon: '🚀',
                iconClass: 'retirement',
                oneliner: 'Supercharge your Roth savings beyond the normal limits',
                limit: null,
                limitLabel: 'Varies by employer match',
                taxContribution: 'After-tax contributions to 401(k), then converted to Roth',
                taxGrowth: 'Tax-free once in Roth',
                taxWithdrawal: 'Tax-free',
                rmd: 'None (Roth)',
                pros: [
                    'Potentially shelter $30,000–$46,500 extra per year in Roth',
                    'Bypasses Roth IRA income limits entirely',
                    'All growth becomes permanently tax-free',
                    'Enormous long-term wealth building potential'
                ],
                cons: [
                    'Not all employers allow after-tax 401(k) contributions',
                    'Not all plans allow in-plan Roth conversions or in-service distributions',
                    'Requires understanding and setup — more complex',
                    'No tax deduction on contributions'
                ],
                bestFor: 'High earners who have maxed out their regular 401(k) and Roth IRA options and want more tax-free space.',
                gotchas: 'The 2025 total 401(k) limit is $70,000 (all sources combined). Your mega backdoor space = $70,000 minus your employee deferrals ($23,500) minus employer match. Convert quickly after contributing to avoid taxable earnings buildup. You MUST check if your specific plan allows this.'
            },
            rothIRA: {
                id: 'rothIRA',
                name: 'Roth IRA',
                icon: '💎',
                iconClass: 'retirement',
                oneliner: 'Personal tax-free retirement account — flexible and powerful',
                limit: 7000,
                limitLabel: '/year per person ($14,000 couple)',
                catchUp50: 1000,
                taxContribution: 'After-tax — no deduction',
                taxGrowth: 'Tax-free',
                taxWithdrawal: 'Tax-free (contributions can be withdrawn anytime penalty-free)',
                rmd: 'None',
                incomePhaseout: { start: 236000, end: 246000 },
                pros: [
                    'Tax-free growth and withdrawals forever',
                    'No required minimum distributions',
                    'Contributions (not earnings) can be withdrawn anytime without penalty',
                    'Great emergency backup — more flexible than 401(k)',
                    'Tax-free inheritance for your heirs'
                ],
                cons: [
                    'Low contribution limit ($7,000/person)',
                    'Income phase-out: can\'t contribute directly if MFJ income over $246,000',
                    'No tax break today',
                    '5-year rule on earnings withdrawals'
                ],
                bestFor: 'Almost everyone — it\'s one of the most flexible and powerful tax vehicles. Especially valuable for long time horizons.',
                gotchas: 'If your income exceeds $246,000 (MFJ), you can\'t contribute directly. But you CAN do a "Backdoor Roth" — contribute to a Traditional IRA (non-deductible) then convert to Roth. Watch the pro-rata rule: if you have existing pre-tax IRA balances, the conversion gets partially taxed. Fix: roll pre-tax IRA money into your 401(k) first.'
            },
            tradIRA: {
                id: 'tradIRA',
                name: 'Traditional IRA',
                icon: '📋',
                iconClass: 'retirement',
                oneliner: 'Tax-deductible personal retirement account',
                limit: 7000,
                limitLabel: '/year per person',
                catchUp50: 1000,
                taxContribution: 'Tax-deductible (if eligible)',
                taxGrowth: 'Tax-deferred',
                taxWithdrawal: 'Taxed as ordinary income',
                rmd: 'Required at age 73',
                deductionPhaseout: { start: 126000, end: 146000 },
                spousePhaseout: { start: 236000, end: 246000 },
                pros: [
                    'Tax deduction reduces your taxable income today',
                    'Available to anyone with earned income',
                    'Can be used as a stepping stone for Backdoor Roth'
                ],
                cons: [
                    'Deductibility phases out if you have a workplace plan (MFJ $126K-$146K)',
                    'Withdrawals are fully taxed in retirement',
                    'Required minimum distributions at 73',
                    'Lower limit than 401(k)'
                ],
                bestFor: 'People without access to a 401(k), or as a Backdoor Roth pathway for high earners.',
                gotchas: 'If you or your spouse has a 401(k) at work and your income is above the phase-out, the contribution isn\'t deductible — making it less useful except as a Backdoor Roth stepping stone.'
            },
            hsa: {
                id: 'hsa',
                name: 'Health Savings Account (HSA)',
                icon: '🏥',
                iconClass: 'health',
                oneliner: 'Triple-tax-free medical savings — the best tax vehicle in the US',
                limit: 8550,
                limitLabel: '/year (family)',
                limitSelf: 4300,
                catchUp55: 1000,
                taxContribution: 'Tax-deductible (or pre-tax via payroll)',
                taxGrowth: 'Tax-free',
                taxWithdrawal: 'Tax-free for medical expenses',
                rmd: 'None',
                pros: [
                    'TRIPLE tax advantage — deduction going in, no tax on growth, no tax coming out',
                    'The single most tax-efficient vehicle in the entire US tax code',
                    'After age 65, non-medical withdrawals taxed as income (like a Traditional IRA) — no penalty',
                    'No "use it or lose it" — rolls over forever (unlike FSA)',
                    'Can invest the balance in stocks/bonds for long-term growth'
                ],
                cons: [
                    'Requires a High Deductible Health Plan (HDHP)',
                    'HDHP means higher out-of-pocket costs for medical care',
                    'Relatively low contribution limit',
                    'Non-medical withdrawals before 65 face 20% penalty + taxes'
                ],
                bestFor: 'Anyone with an HDHP. Best strategy: pay medical expenses out-of-pocket now, invest the HSA, then reimburse yourself decades later — all tax-free.',
                gotchas: 'Keep receipts for all medical expenses forever. You can reimburse yourself years later, tax-free, even after the HSA has grown substantially. There\'s no time limit on reimbursement.'
            },
            plan529: {
                id: 'plan529',
                name: '529 Education Plan',
                icon: '🎓',
                iconClass: 'education',
                oneliner: 'Tax-free growth for your kids\' education expenses',
                limit: null,
                limitLabel: 'No federal annual limit',
                giftLimit: 19000,
                superfund: 95000,
                stateCap: 500000,
                taxContribution: 'Not deductible (federally or in WA)',
                taxGrowth: 'Tax-free',
                taxWithdrawal: 'Tax-free for education expenses (tuition, room, board, books, K-12 up to $10K/yr)',
                rmd: 'None',
                pros: [
                    'Tax-free growth on investments',
                    'Tax-free withdrawals for qualified education expenses',
                    'Can "superfund" — contribute up to $190,000 (couple) upfront using 5-year gift averaging',
                    'Starting 2024, unused 529 can roll to beneficiary\'s Roth IRA (up to $35K lifetime)',
                    'Reduces your taxable estate — gifts leave your estate',
                    'Can change the beneficiary to another family member'
                ],
                cons: [
                    'No federal tax deduction (and WA has no state income tax, so no state deduction either)',
                    'Non-qualified withdrawals: earnings taxed + 10% penalty',
                    'Limited investment options within the plan',
                    'If your child gets a full scholarship, you still "used up" the money'
                ],
                bestFor: 'Parents who want tax-free growth for education and potential estate tax reduction (important in WA where estate tax starts at $3M).',
                gotchas: 'The 529-to-Roth IRA rollover (new since 2024) requires the 529 account to be open for 15+ years, and is limited to $35,000 lifetime per beneficiary. Great safety valve if your child doesn\'t need the education money.'
            },
            utma: {
                id: 'utma',
                name: 'UTMA/UGMA Custodial',
                icon: '👶',
                iconClass: 'flexible',
                oneliner: 'Flexible investment account for your children — no restrictions on use',
                limit: null,
                limitLabel: 'No limit (gift tax above $19K)',
                taxContribution: 'No deduction',
                taxGrowth: 'Kiddie tax: first $1,350 tax-free, next $1,350 at child\'s rate, above $2,700 at your rate',
                taxWithdrawal: 'N/A — it\'s a brokerage account',
                rmd: 'None',
                pros: [
                    'No restrictions on how the money is used (unlike 529)',
                    'Some tax benefit on first $2,700 of unearned income',
                    'Can invest in anything — stocks, bonds, real estate',
                    'Good for non-education goals for your children'
                ],
                cons: [
                    'Child gets full control at age 21 (in WA) — no restrictions',
                    'Hurts financial aid — counted as student asset (assessed at 20%)',
                    'Limited tax benefit due to kiddie tax above $2,700',
                    'Irrevocable — once gifted, it\'s the child\'s money'
                ],
                bestFor: 'Parents who want flexible savings for their children beyond education, and are comfortable with the child controlling assets at 21.',
                gotchas: 'The "kiddie tax" means investment income above $2,700 is taxed at YOUR marginal rate, not the child\'s. This largely eliminates the tax benefit for larger accounts.'
            },
            revocableTrust: {
                id: 'revocableTrust',
                name: 'Revocable Living Trust',
                icon: '📜',
                iconClass: 'estate',
                oneliner: 'Avoid probate and control asset distribution — no tax benefit',
                limit: null,
                limitLabel: 'No limit',
                taxContribution: 'No tax benefit — pass-through to you',
                taxGrowth: 'Taxed to you (grantor trust)',
                taxWithdrawal: 'N/A',
                rmd: 'N/A',
                pros: [
                    'Avoids probate (expensive in WA — up to 2% of estate)',
                    'Privacy — trusts don\'t become public record like wills',
                    'You maintain full control and can change it anytime',
                    'Seamless transfer of assets at death'
                ],
                cons: [
                    'No tax benefit whatsoever — assets still in your estate',
                    'Setup cost ($1,500-$5,000 with attorney)',
                    'Must "fund" the trust by retitling assets',
                    'No asset protection from creditors'
                ],
                bestFor: 'Anyone who wants to avoid probate and maintain control. Especially useful in WA where probate costs can be significant.',
                gotchas: 'This does NOT reduce estate taxes. If your estate is above WA\'s $3M threshold, you need additional planning (irrevocable trust, gifting, etc.).'
            },
            irrevocableTrust: {
                id: 'irrevocableTrust',
                name: 'Irrevocable Trust',
                icon: '🔒',
                iconClass: 'estate',
                oneliner: 'Permanently remove assets from your estate — reduces estate tax',
                limit: null,
                limitLabel: 'No limit',
                taxContribution: 'Gifts to trust use your lifetime gift exemption ($13.99M)',
                taxGrowth: 'Trust taxed at compressed brackets, or distributed to beneficiaries',
                taxWithdrawal: 'Beneficiaries taxed on distributions',
                rmd: 'N/A',
                pros: [
                    'Removes assets from your taxable estate',
                    'Critical for WA estate tax planning ($3M threshold)',
                    'Asset protection from creditors',
                    'Can lock in current high federal exemption ($13.99M) before potential sunset'
                ],
                cons: [
                    'Permanent — you give up control of the assets',
                    'Complex and expensive to set up',
                    'Trust income taxed at highest bracket quickly ($15,200+)',
                    'Cannot easily modify or revoke'
                ],
                bestFor: 'Families with estates approaching $3M+ (WA threshold). Essential planning tool given WA\'s low estate tax exemption.',
                gotchas: 'The federal exemption of $13.99M is scheduled to sunset (possibly to ~$7M) — current legislation may extend it. WA estate tax is a separate concern with its $3M threshold. Trust income that stays in the trust hits the 37% bracket at just $15,200 — distribute income to beneficiaries when possible.'
            }
        }
    },
    ca: {
        year: 2025,
        label: 'Canada (British Columbia)',
        currency: 'CAD',
        currencySymbol: 'C$',
        federalBrackets: [
            { min: 0, max: 57375, rate: 0.145 },
            { min: 57375, max: 114750, rate: 0.205 },
            { min: 114750, max: 177882, rate: 0.26 },
            { min: 177882, max: 253414, rate: 0.29 },
            { min: 253414, max: Infinity, rate: 0.33 }
        ],
        provincialBrackets: [
            { min: 0, max: 49279, rate: 0.0506 },
            { min: 49279, max: 98560, rate: 0.0770 },
            { min: 98560, max: 113158, rate: 0.1050 },
            { min: 113158, max: 154906, rate: 0.1229 },
            { min: 154906, max: 227091, rate: 0.1470 },
            { min: 227091, max: 259829, rate: 0.1680 },
            { min: 259829, max: Infinity, rate: 0.2050 }
        ],
        federalPersonalAmount: 16129,
        provincialPersonalAmount: 12580,
        stateNotes: 'British Columbia has both federal and provincial income tax. The combined top marginal rate is 53.50%. Canada has no estate tax, but there is a deemed disposition at death (capital gains tax on all assets). CPP/EI are mandatory payroll deductions.',
        vehicles: {
            rrsp: {
                id: 'rrsp',
                name: 'RRSP',
                icon: '🏦',
                iconClass: 'retirement',
                oneliner: 'Pre-tax retirement savings — Canada\'s version of the Traditional 401(k)',
                limit: 32490,
                limitLabel: '/year (or 18% of income)',
                limitPercent: 0.18,
                taxContribution: 'Fully deductible — reduces your taxable income',
                taxGrowth: 'Tax-deferred',
                taxWithdrawal: 'Taxed as ordinary income when withdrawn',
                rmd: 'Must convert to RRIF by Dec 31 of year you turn 71',
                pros: [
                    'Immediate tax deduction at your combined marginal rate (up to 53.5%)',
                    'Spousal RRSP allows income splitting in retirement',
                    'Unused contribution room carries forward indefinitely',
                    'Home Buyers\' Plan: borrow up to $60,000 for first home',
                    'Lifelong Learning Plan: borrow up to $20,000 for education'
                ],
                cons: [
                    'All withdrawals taxed as income in retirement',
                    'Withholding tax on early withdrawals (10-30% depending on amount)',
                    'Must convert to RRIF by 71 with mandatory minimum withdrawals',
                    'Over-contributions beyond $2,000 buffer penalized 1%/month'
                ],
                bestFor: 'High earners who expect lower income in retirement. The higher your current tax rate vs. your expected retirement rate, the bigger the benefit.',
                gotchas: 'Your RRSP limit is 18% of your previous year\'s earned income, up to $32,490 for 2025. If you have a pension, your room is reduced by a "pension adjustment." Spousal RRSP contributions use YOUR room but the account is in your spouse\'s name — great for income splitting in retirement. The $2,000 over-contribution buffer is a one-time lifetime cushion, not annual.'
            },
            tfsa: {
                id: 'tfsa',
                name: 'TFSA',
                icon: '💎',
                iconClass: 'retirement',
                oneliner: 'Tax-free savings — Canada\'s most flexible account',
                limit: 7000,
                limitLabel: '/year per person ($14,000 couple)',
                cumulativeRoom: 102000,
                taxContribution: 'After-tax — no deduction',
                taxGrowth: 'Completely tax-free',
                taxWithdrawal: 'Completely tax-free — no restrictions on use',
                rmd: 'None',
                pros: [
                    'Total flexibility — withdraw anytime, for any reason, completely tax-free',
                    'Withdrawals don\'t affect government benefits (OAS, GIS, CCB)',
                    'Withdrawal room gets added back the following year',
                    'No required withdrawals ever',
                    'Can hold stocks, bonds, ETFs, GICs — same as RRSP'
                ],
                cons: [
                    'No tax deduction on contributions',
                    'Relatively low annual limit ($7,000)',
                    'Over-contributions penalized 1%/month with no buffer',
                    'Day trading may cause CRA to tax it as business income'
                ],
                bestFor: 'Everyone. It\'s the most flexible tax-advantaged account in Canada. Especially valuable for lower/middle income earners and as a complement to RRSP.',
                gotchas: 'If you\'ve been a Canadian resident since 2009 and were 18+, your cumulative room is $102,000. Track your room carefully — CRA penalties for over-contribution are strict with no buffer. The TFSA is often compared to a Roth IRA but is even more flexible (no age restrictions on withdrawals, room comes back after withdrawal).'
            },
            resp: {
                id: 'resp',
                name: 'RESP',
                icon: '🎓',
                iconClass: 'education',
                oneliner: 'Education savings with free government matching — up to $7,200 per child',
                limit: 2500,
                limitLabel: '/year per child (for max CESG)',
                lifetimeLimit: 50000,
                cesgRate: 0.20,
                cesgMax: 500,
                cesgLifetime: 7200,
                taxContribution: 'No deduction',
                taxGrowth: 'Tax-deferred (grants + growth)',
                taxWithdrawal: 'Growth + grants taxed in student\'s hands (usually minimal tax)',
                rmd: 'None',
                pros: [
                    'FREE 20% government match (CESG) — $500/year per child',
                    'Up to $7,200 in free grants per child over their lifetime',
                    'Growth taxed in student\'s hands — often at 0% or very low rate',
                    'Your original contributions come back to you tax-free',
                    'Additional CESG for lower-income families'
                ],
                cons: [
                    'No tax deduction on contributions',
                    'If child doesn\'t pursue post-secondary, CESG must be returned to government',
                    'Growth on non-education withdrawal taxed at your rate + 20% penalty',
                    'Lifetime limit of $50,000 per beneficiary'
                ],
                bestFor: 'Every parent with children. The 20% instant return from CESG is the best guaranteed return available.',
                gotchas: 'Contribute at least $2,500/year per child to get the full $500 CESG. If you missed years, you can carry forward — contribute $5,000 to get $1,000 CESG (max catch-up is $1,000 CESG/year). You can transfer unused growth to your RRSP (up to $50,000 if you have room) if the child doesn\'t go to school. CESG stops at the end of the year the child turns 17.'
            },
            fhsa: {
                id: 'fhsa',
                name: 'FHSA',
                icon: '🏠',
                iconClass: 'home',
                oneliner: 'First Home Savings — combines the best of RRSP and TFSA for buying a home',
                limit: 8000,
                limitLabel: '/year ($40,000 lifetime)',
                lifetimeLimit: 40000,
                taxContribution: 'Fully tax-deductible (like RRSP)',
                taxGrowth: 'Tax-free',
                taxWithdrawal: 'Tax-free for qualifying home purchase (like TFSA)',
                rmd: 'Must use within 15 years or by age 71',
                pros: [
                    'Double tax benefit — deduction going in AND tax-free coming out',
                    'The most tax-efficient vehicle for first-time home buyers',
                    'Unused room carries forward ($8,000 max)',
                    'If you don\'t buy a home, can transfer to RRSP without using RRSP room',
                    'Can combine with HBP ($60,000 from RRSP) for up to $100,000 tax-advantaged'
                ],
                cons: [
                    'Only for first-time buyers (no home ownership in past 4 years)',
                    'Lifetime limit of $40,000',
                    'Must be used within 15 years of opening',
                    'Non-qualifying withdrawals are taxable'
                ],
                bestFor: 'First-time home buyers — this is the most powerful home savings vehicle ever created in Canada.',
                gotchas: 'Open the account as soon as possible even if you can\'t contribute yet — carry-forward room only starts accumulating AFTER you open the account. You can combine FHSA withdrawals with the Home Buyers\' Plan (RRSP) for a total of $100,000 in tax-advantaged home savings.'
            },
            familyTrust: {
                id: 'familyTrust',
                name: 'Family Trust',
                icon: '📜',
                iconClass: 'estate',
                oneliner: 'Income splitting and estate planning for families',
                limit: null,
                limitLabel: 'No limit',
                taxContribution: 'No deduction — uses after-tax dollars',
                taxGrowth: 'Undistributed income taxed at top rate (53.5%); distributed income taxed in beneficiary\'s hands',
                taxWithdrawal: 'Beneficiaries report distributions as their income',
                rmd: 'N/A',
                pros: [
                    'Split income with lower-income family members (adult children)',
                    'Multiply lifetime capital gains exemption across family members',
                    'Estate freeze — lock current value for tax purposes',
                    'Probate avoidance',
                    'Asset protection and control over distribution timing'
                ],
                cons: [
                    'Complex and expensive to set up ($2,000-$10,000+)',
                    'Annual T3 tax filing required',
                    '21-year deemed disposition rule — triggers capital gains every 21 years',
                    'Undistributed income taxed at highest rate',
                    'Attribution rules limit income splitting with minor children/spouse',
                    'Cannot split income with children under 18 (kiddie tax / TOSI rules)'
                ],
                bestFor: 'Families with business income, significant investments, or estate planning needs above $5M+. Most useful when you have adult children as beneficiaries.',
                gotchas: 'The 21-year deemed disposition means the trust is treated as if it sold all assets every 21 years — triggering capital gains tax. Plan the trust\'s end date carefully. TOSI (Tax on Split Income) rules severely limit income splitting with minor children — this is primarily useful for adult beneficiaries. Canada has no estate tax, but there is a "deemed disposition" at death — all assets are treated as sold at fair market value.'
            },
            bareTrust: {
                id: 'bareTrust',
                name: 'Bare Trust / In-Trust Account',
                icon: '👶',
                iconClass: 'flexible',
                oneliner: 'Simple trust arrangement for holding assets for children',
                limit: null,
                limitLabel: 'No limit',
                taxContribution: 'No deduction',
                taxGrowth: 'Attribution rules: interest/dividends taxed to parent; capital gains taxed to child',
                taxWithdrawal: 'N/A — depends on attribution',
                rmd: 'N/A',
                pros: [
                    'Simple to set up — just an investment account "in trust for" the child',
                    'Capital gains attributed to the child (usually low/no tax)',
                    'Probate avoidance on the assets held in trust',
                    'No formal trust deed required for bare trusts'
                ],
                cons: [
                    'Attribution rules: interest and dividends taxed back to the parent',
                    'CRA scrutiny on bare trust reporting',
                    'Child entitled to assets at age of majority (19 in BC)',
                    'Less control than a formal family trust',
                    'Bare trust filing relief for 2025 but rules expected to tighten for 2026+'
                ],
                bestFor: 'Parents wanting a simple way to invest for children with some tax benefit on capital gains.',
                gotchas: 'Attribution rules are strict: if you give money to your minor child and they invest it, interest and Canadian dividends are taxed in YOUR hands. Only capital gains are attributed to the child. Workaround: invest in growth stocks (no dividends) to maximize capital gains attribution to the child.'
            }
        }
    }
};
