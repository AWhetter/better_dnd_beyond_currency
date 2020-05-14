function saveOptions(e) {
    e.preventDefault();
    browser.storage.sync.set({
        useElectrum: document.querySelector("#useElectrum").checked
    });
}

function restoreOptions() {

    function setCurrentChoice(result) {
        document.querySelector("#useElectrum").checked = result.useElectrum || false;
    }

    function onError(error) {
        console.log(`Error: ${error}`);
    }

    let getting = browser.storage.sync.get("useElectrum");
    getting.then(setCurrentChoice, onError);
}

document.addEventListener("DOMContentLoaded", restoreOptions);
document.querySelector("form").addEventListener("submit", saveOptions);
