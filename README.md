# Human Benchmark JS Bot

Gets 100th percentile on the [human benchmark](https://humanbenchmark.com/tests/sequence) using only Javascript injected in the console. It only looks at the DOM to determine the state (doesn't hack into the JS for each test), then dispatches mouse and keyboard events to pass each test.

Circumvents needing to use vision tools (like other human benchmark bots)  to read the webpage since it can use the DOM directly. Also, doesn't need any tool to be installed other than the web browser.

The tool is configured to be paste-able in the JS console. It also doesn't need to be re-run on every test as long as the page is not reloaded (SPA for the win!). Navigating between multiple tests should work fine.

It also can be setup as a [Tampermonkey](https://www.tampermonkey.net/)/[Greasemonkey](https://github.com/greasemonkey/greasemonkey) userscript.

Let me know in an issue if something doesn't work.