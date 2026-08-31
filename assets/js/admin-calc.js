// Kaghan Properties - Real Estate Financial & Construction Calculator Module

window.AdminCalc = {
    calculateInstallmentPlan: function(totalPrice, downPaymentPercent = 25, durationMonths = 36) {
        totalPrice = parseFloat(totalPrice) || 0;
        const downPayment = (totalPrice * downPaymentPercent) / 100;
        const remaining = totalPrice - downPayment;
        const monthlyPayment = remaining / durationMonths;
        const possessionFee = (totalPrice * 10) / 100; // 10% on possession

        return {
            totalPrice,
            downPayment,
            downPaymentPercent,
            durationMonths,
            monthlyPayment: Math.round(monthlyPayment),
            possessionFee,
            quarterlyPayment: Math.round(monthlyPayment * 3)
        };
    },

    calculateRentalYield: function(propertyPrice, expectedMonthlyRent) {
        propertyPrice = parseFloat(propertyPrice) || 0;
        expectedMonthlyRent = parseFloat(expectedMonthlyRent) || 0;
        if (propertyPrice === 0) return 0;

        const annualRent = expectedMonthlyRent * 12;
        const yieldPercentage = (annualRent / propertyPrice) * 100;
        return parseFloat(yieldPercentage.toFixed(2));
    },

    calculateConstructionCost: function(marlaSize, qualityGrade = 'A_category') {
        // Standard rates for Islamabad per sq ft (2026)
        const sizeMap = { 5: 1975, 7: 2650, 10: 3800, 20: 7200 }; // Total covered sq ft
        const ratePerSqFt = qualityGrade === 'A_category' ? 3200 : qualityGrade === 'luxury' ? 4500 : 2600;

        const coveredAreaSqFt = sizeMap[marlaSize] || (marlaSize * 225);
        const estimatedGreyStructure = coveredAreaSqFt * 1650;
        const estimatedFinishing = coveredAreaSqFt * (ratePerSqFt - 1650);
        const totalEstimatedCost = coveredAreaSqFt * ratePerSqFt;

        return {
            marlaSize,
            coveredAreaSqFt,
            ratePerSqFt,
            estimatedGreyStructure,
            estimatedFinishing,
            totalEstimatedCost
        };
    },

    calculateCommission: function(dealPrice, commissionRate = 2) {
        dealPrice = parseFloat(dealPrice) || 0;
        const totalCommission = (dealPrice * commissionRate) / 100;
        const agentShare = totalCommission * 0.6; // 60% agent, 40% agency
        const agencyShare = totalCommission * 0.4;

        return {
            dealPrice,
            commissionRate,
            totalCommission,
            agentShare,
            agencyShare
        };
    }
};
