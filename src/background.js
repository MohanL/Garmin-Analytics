const ANALYTICS_URL = 'https://connect.garmin.com/modern/analytics';
const ANALYTICS_PAGE_SELECTED = window.location.href === ANALYTICS_URL;

const initialPageLoadInterval = setInterval(function () {
    const menuElement = document.getElementsByClassName('main-nav-group dashboards')[0];

    if (menuElement) {
        addIconsSource();
        addAnalyticsMenuItem(menuElement);
        initAnalyticsPage();

        clearInterval(initialPageLoadInterval);
    }
}, 100);

function addIconsSource() {
    const link = document.createElement('link');
    link.href = 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/4.7.0/css/font-awesome.min.css';
    link.rel = 'stylesheet';

    document.getElementsByTagName('head')[0].appendChild(link);
}

function addAnalyticsMenuItem(menuElement) {
    const activeTabStyleClass = ANALYTICS_PAGE_SELECTED ? 'active' : '';

    const analyticsItem = document.createElement("li");
    analyticsItem.classList.add('main-nav-item');
    analyticsItem.innerHTML = `
        <a href="/modern/analytics" class="main-nav-link ${ activeTabStyleClass }">
            <i class="nav-icon fa fa-bar-chart" aria-hidden="true"></i>
            <span class="nav-text">Analytics</span>
        </a>
    `;
    
    menuElement.appendChild(analyticsItem);
}

function initAnalyticsPage() {
    if (!ANALYTICS_PAGE_SELECTED) {
        return;
    }

    var iframe = document.createElement('iframe');
    iframe.src = chrome.runtime.getURL('index.html');
    iframe.style.cssText = 'width: 100%; height: calc(100vh - 120px);';

    var contentContainer = document.getElementsByClassName('content')[0];
    contentContainer.innerHTML = '';
    contentContainer.appendChild(iframe);

    loadData().then((data) => {
        iframe.contentWindow.postMessage(data, "*");
    });    
}



async function loadData() {
    let page = 1;
    let activities = [];
    let allPagesLoaded = false;

    do {
        const response = await loadPageData(page++);
        activities = [...activities, ...response];
        allPagesLoaded = response.length === 0;
    } while (!allPagesLoaded);

    return activities;
}

async function loadPageData(page) {
    const limit = 100;
    const start = (page - 1) * limit;

    const url = `https://connect.garmin.com/activitylist-service/activities/search/activities?limit=${limit}&start=${start}`;

    const response = await fetch(url, {
        method: 'GET',
        headers: {
            'di-backend': 'connectapi.garmin.com',
            'authorization': 'Bearer ' + JSON.parse(localStorage.getItem('token')).access_token
        }
    });

    return response.json();
}

// TODO: CLEANUP

function setupRunsData(data) {
    const runs = data.filter(activity => activity.activityType.typeId === ACTIVITY_RUN).map(activity => activity.startTimeLocal.split(' ')[0]);
    const firstDate = new Date(runs[runs.length - 1]);
    const lastDate = new Date(runs[0]);

    const datesRange = getAllDatesInTheRange(firstDate, lastDate);

    let sets = [];
    let currentSet = [];

    datesRange.map(date => date.toJSON().split('T')[0]).forEach((date, index) => {
        const activityExist = runs.indexOf(date) > -1;
        const lastItem = index === datesRange.length - 1;

        console.log(date + ' - ' + activityExist);

        if (activityExist) {
            currentSet = [...currentSet, date];
        }

        if ((!activityExist || lastItem) && currentSet.length > 0) {
            sets = [...sets, [...currentSet]];
            currentSet = [];
        }
    });

    const timesInARow = sets[sets.length - 1].length;

    const maxInARow = Math.max(...sets.map(set => set.length));
    const longestSets = sets.filter(set => set.length === maxInARow).map(set => [set[0], set[set.length - 1]]);

    console.log('Current times in a row - ' + timesInARow + ' days');
    console.log('Max days in a row ' + maxInARow + ' days');
    console.log(longestSets);
    
}

function getAllDatesInTheRange(startDate, stopDate) {
    const dateArray = []

    const startDateIgnoreTimezone = getPureDate(startDate);
    const stopDateIgnoreTimezone = getPureDate(stopDate);

    let currentDate = new Date(startDateIgnoreTimezone);

    while (currentDate <= stopDateIgnoreTimezone) {
        dateArray.push(new Date(currentDate));
        currentDate.setDate(currentDate.getDate() + 1);
    }

    return dateArray;
}

function getPureDate(date) {
    const result = new Date(date);

    const hoursDiff = result.getHours() - result.getTimezoneOffset() / 60;
    const minutesDiff = (result.getHours() - result.getTimezoneOffset()) % 60;
    
    result.setHours(hoursDiff);
    result.setMinutes(minutesDiff);

    return result;
}
