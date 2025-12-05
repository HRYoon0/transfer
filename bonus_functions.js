// 날짜 자동 포맷팅 (yyyy.mm.dd)
function formatDate(input) {
    let value = input.value.replace(/[^0-9]/g, '');
    if (value.length >= 8) {
        value = value.substring(0, 8);
        input.value = value.substring(0, 4) + '.' + value.substring(4, 6) + '.' + value.substring(6, 8);
    } else if (value.length >= 6) {
        input.value = value.substring(0, 4) + '.' + value.substring(4, 6) + '.' + value.substring(6);
    } else if (value.length >= 4) {
        input.value = value.substring(0, 4) + '.' + value.substring(4);
    } else {
        input.value = value;
    }
}

// 기간 자동 포맷팅 (yyyy.mm.dd~yyyy.mm.dd)
function formatPeriod(input) {
    let value = input.value.replace(/[^0-9]/g, '');

    if (value.length >= 16) {
        value = value.substring(0, 16);
        input.value = value.substring(0, 4) + '.' + value.substring(4, 6) + '.' + value.substring(6, 8) +
                     '~' + value.substring(8, 12) + '.' + value.substring(12, 14) + '.' + value.substring(14, 16);
    } else if (value.length >= 8) {
        const part1 = value.substring(0, 4) + '.' + value.substring(4, 6) + '.' + value.substring(6, 8);
        const part2 = value.substring(8);
        if (part2.length >= 6) {
            input.value = part1 + '~' + part2.substring(0, 4) + '.' + part2.substring(4, 6) + '.' + part2.substring(6);
        } else if (part2.length >= 4) {
            input.value = part1 + '~' + part2.substring(0, 4) + '.' + part2.substring(4);
        } else if (part2.length > 0) {
            input.value = part1 + '~' + part2;
        } else {
            input.value = part1;
        }
    } else if (value.length >= 6) {
        input.value = value.substring(0, 4) + '.' + value.substring(4, 6) + '.' + value.substring(6);
    } else if (value.length >= 4) {
        input.value = value.substring(0, 4) + '.' + value.substring(4);
    } else {
        input.value = value;
    }
}

// 기간 계산 (개월 수)
function calculatePeriodMonths(periodStr) {
    if (!periodStr || !periodStr.includes('~')) return 0;

    const [start, end] = periodStr.split('~');
    const startDate = new Date(start.replace(/\./g, '-'));
    const endDate = new Date(end.replace(/\./g, '-'));

    if (isNaN(startDate) || isNaN(endDate) || endDate < startDate) return 0;

    const months = (endDate.getFullYear() - startDate.getFullYear()) * 12 +
                  (endDate.getMonth() - startDate.getMonth()) +
                  (endDate.getDate() >= startDate.getDate() ? 1 : 0);

    return Math.max(0, months);
}

function handlePeriodInput(id) {
    const itemSelect = document.getElementById(`bonus-item-${id}`);
    const periodInput = document.getElementById(`bonus-period-${id}`);
    const selectedOption = itemSelect.options[itemSelect.selectedIndex];

    if (!selectedOption || !selectedOption.value) return;

    const inputType = selectedOption.dataset.inputType;

    if (inputType === 'date') {
        formatDate(periodInput);
    } else if (inputType === 'period') {
        formatPeriod(periodInput);
    }
}

function calculateBonusScore(id) {
    const itemSelect = document.getElementById(`bonus-item-${id}`);
    const periodInput = document.getElementById(`bonus-period-${id}`);
    const scoreInput = document.getElementById(`bonus-score-${id}`);
    const selectedOption = itemSelect.options[itemSelect.selectedIndex];

    if (!selectedOption || !selectedOption.value) return;

    const baseScore = parseFloat(selectedOption.dataset.score);
    const unit = selectedOption.dataset.unit;
    const inputType = selectedOption.dataset.inputType;
    const periodValue = periodInput.value.trim();

    // inputType이 none이면 이미 점수가 설정됨
    if (inputType === 'none') return;

    // 기간/연월일이 입력되지 않으면 점수 0
    if (!periodValue) {
        scoreInput.value = '';
        calculateScore();
        return;
    }

    // date 타입은 기본 점수 그대로
    if (inputType === 'date') {
        // 날짜 형식 검증 (yyyy.mm.dd)
        if (/^\d{4}\.\d{2}\.\d{2}$/.test(periodValue)) {
            scoreInput.value = baseScore.toFixed(3);
        } else {
            scoreInput.value = '';
        }
        calculateScore();
        return;
    }

    // period 타입은 기간 계산
    if (inputType === 'period' && unit) {
        // 기간 형식 검증 (yyyy.mm.dd~yyyy.mm.dd)
        if (!/^\d{4}\.\d{2}\.\d{2}~\d{4}\.\d{2}\.\d{2}$/.test(periodValue)) {
            scoreInput.value = '';
            calculateScore();
            return;
        }

        const months = calculatePeriodMonths(periodValue);
        let finalScore = 0;

        if (unit.includes('6개월마다')) {
            const periods = Math.floor(months / 6);
            finalScore = baseScore * periods;

            // "2년간" 제한 확인
            const itemName = selectedOption.textContent;
            if (itemName.includes('2년간')) {
                const maxPeriods = 4; // 2년 = 24개월 = 4 × 6개월
                finalScore = Math.min(finalScore, baseScore * maxPeriods);
            }
        } else if (unit.includes('1개월마다')) {
            finalScore = baseScore * months;

            // "2년간" 제한
            const itemName = selectedOption.textContent;
            if (itemName.includes('2년간')) {
                const maxMonths = 24;
                finalScore = Math.min(finalScore, baseScore * maxMonths);
            }
        } else if (unit.includes('1년마다')) {
            const years = Math.floor(months / 12);
            finalScore = baseScore * years;

            // "2년간" 제한
            const itemName = selectedOption.textContent;
            if (itemName.includes('2년간')) {
                finalScore = Math.min(finalScore, baseScore * 2);
            }
        } else {
            // 단위가 명시되지 않은 경우 기본 점수
            finalScore = baseScore;
        }

        scoreInput.value = finalScore.toFixed(3);
    } else {
        // 단위가 없으면 기본 점수
        scoreInput.value = baseScore.toFixed(3);
    }

    calculateScore();
}
