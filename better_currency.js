(function () {
	const coins = [
		"platinum",
		"gold",
		"electrum",
		"silver",
		"copper",
	];

	const copperValues = [
		1000,
		100,
		50,
		10,
		1,
	];
	var config = {};

	function calcNewValues(currentValues, removeValues, useElectrum) {
		var newValues = removeValues.map((removeValue, idx) => {
			return currentValues[idx] - removeValue;
		});
		for (var i = newValues.length - 1; i >= 0; i--) {
			if (newValues[i] < 0) {
				// There isn't enough money, so remove it all.
				if (i == 0) {
					for (var j = 0; j < newValues.length; j++) {
						newValues[j] = 0;
					}
					break;
				}
				var diff = Math.ceil((-newValues[i] * copperValues[i]) / copperValues[i - 1]);
				newValues[i - 1] -= diff;
				newValues[i] += (diff * copperValues[i - 1]) / copperValues[i];
			}
		}

		console.log(config);
		console.log(useElectrum);
		if (!useElectrum) {
			newValues[3] += newValues[2] * 5;
			newValues[2] = 0;
		}

		return newValues;
	}

	function patchCurrencyPane(currencyPane) {
		var removeDiv = currencyPane.getElementsByClassName("ct-currency-pane__adjuster-action--negative")[0];
		var removeButton = removeDiv.children[0];
		var newRemoveButton = removeButton.cloneNode(true);
		removeDiv.appendChild(newRemoveButton);
		removeButton.style.display = "none";
		var addDiv = currencyPane.getElementsByClassName("ct-currency-pane__adjuster-action--positive")[0];
		var addButton = addDiv.children[0];

		function doRemove() {
			var currentValues = coins.map(coin => {
				var div = currencyPane.getElementsByClassName("ct-currency-pane__currency--" + coin)[0];
				var text = div.getElementsByClassName("ct-currency-pane__currency-value-text")[0];
				return parseInt(text.textContent, 10);
			});

			var inputs = coins.map(coin => {
				var div = currencyPane.getElementsByClassName("ct-currency-pane__adjuster-type--" + coin)[0];
				return div.getElementsByClassName("ct-currency-pane__adjuster-type-value-input")[0];
			})
			var removeValues = inputs.map(input => {
				return parseInt(input.value || "0", 10);
			});

			var newValues = calcNewValues(currentValues, removeValues, config.useElectrum);

			// The input boxes do things when changed,
			// so wait for all changes to happen by
			// adding a new listener (which will be called last)
			// that finishes the promise when it is called
			// and therefore indicates that all other events have finished.
			var removePromises = inputs.map((input, idx) => {
				var change = Math.max(currentValues[idx] - newValues[idx], 0);
				if (input.value != change) {
					return new Promise(resolve => {
						function handleChanged() {
							input.removeEventListener("blur", handleChanged);
							input.removeEventListener("change", handleChanged);
							resolve(true);
						}
						input.addEventListener("blur", handleChanged);
						input.addEventListener("change", handleChanged);
						input.focus();
						input.value = change;
						input.blur();
					});
				}

				return Promise.resolve(false);
			});

			Promise.all(removePromises).then(() => {
				var removedPromise = new Promise(resolve => {
					function handleClicked() {
						removeButton.removeEventListener("click", handleClicked);
						resolve(true);
					}
					removeButton.addEventListener("click", handleClicked);
					removeButton.click();
				});
				removedPromise.then(() => {
					var addPromises = inputs.map((input, idx) => {
						var change = Math.max(newValues[idx] - currentValues[idx], 0);
						if (input.value != change) {
							return new Promise(resolve => {
								function handleChanged() {
									input.removeEventListener("blur", handleChanged);
									input.removeEventListener("change", handleChanged);
									resolve(true);
								}
								input.addEventListener("blur", handleChanged);
								input.addEventListener("change", handleChanged);
								input.focus()
								input.value = change;
								input.blur()
							});
						}

						return Promise.resolve(false);
					});

					Promise.all(addPromises).then(() => addButton.click());
				});
			});
		}

		newRemoveButton.addEventListener("click", doRemove);
	}

	function observeSidebar(sidebar) {
		const config = { childList: true, subtree: true };
		const callback = function (mutationsList) {
			for (let mutation of mutationsList) {
				for (let addedNode of mutation.addedNodes) {
					var currencyPanes = addedNode.getElementsByClassName("ct-currency-pane");
					if (currencyPanes.length == 1) {
						patchCurrencyPane(currencyPanes[0]);
					}
				}
			}
		};

		const observer = new MutationObserver(callback);
		observer.observe(sidebar, config);
		sidebar._simpleCurrencyObserver = observer;
	}

	function observeBody() {
		function callback() {
			const sidebars = document.getElementsByClassName("ct-sidebar__inner");
			if (sidebars.length == 0) {
				return;
			}

			document.body._simpleCurrencyObserver.disconnect();
			delete document.body._simpleCurrencyObserver;

			observeSidebar(sidebars[0]);
		}

		const observer = new MutationObserver(callback);
		observer.observe(document.body, { childList: true });
		document.body._simpleCurrencyObserver = observer;
	}

	var gettingConfig = browser.storage.sync.get();
	gettingConfig.then((result) => {
		config = result;
		var sideBars = document.getElementsByClassName("ct-sidebar__inner");
		if (sideBars.length == 0) {
			observeBody();
		} else {
			observeSidebar(sideBars[0]);
		}
	})
})();
