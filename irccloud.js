window.onresize = reLayout;
var findMatchCase = false;

function getWebView()
{
  if (!getWebView.view)
    getWebView.view = document.querySelector('webview');

  return getWebView.view;
}

onload = function()
{
  var webview = getWebView();
  reLayout();

  window.addEventListener('keydown', handleKeyDown);
  window.addEventListener('focus', function() { webview.focus(); });

  webview.style.webkitTransition = 'opacity 250ms';
  webview.addEventListener('unresponsive', function() {
    webview.style.opacity = '0.5';
  });
  webview.addEventListener('responsive', function() {
    webview.style.opacity = '1';
  });

  webview.addEventListener('loadstart', function(e) {
    if (e.isTopLevel)
    {
      var parser = document.createElement('a');
      parser.href = e.url;

      if (parser.hostname.match(/^(.*\.)?irccloud.com$/i) === null)
      {
        e.stopImmediatePropagation();
        getWebView().stop();
        window.open(e.url);
      }
    }
  });

  webview.addEventListener('newwindow', function(e) {
    e.stopImmediatePropagation();
    window.open(e.targetUrl);
  });

  document.querySelector('#find-text').oninput = findNext;
  document.querySelector('#find-backward').onclick = findPrev;

  document.querySelector('#find-text').onkeydown = function(event) {
    if (!event.altKey)
    {
      if (!event.ctrlKey && !event.shiftKey)
      {
        if (event.keyCode == 27) // Escape
        {
          event.preventDefault();
          closeFindBox();
        }
      }
      else if (event.ctrlKey)
      {
        if (event.keyCode == 71) // G
        {
          event.preventDefault();
          event.shiftKey ? findPrev() : findNext();
        }
      }
    }
  }

  document.querySelector('#match-case').onclick = function(e) {
    e.preventDefault();
    findMatchCase = !findMatchCase;
    var matchCase = document.querySelector('#match-case');
    matchCase.style.color = findMatchCase ? "blue" : "black";
    matchCase.style['font-weight'] = findMatchCase ? "bold" : "";
    webview.find(document.forms['find-form']['find-text'].value,
     {matchCase: findMatchCase});
  }

  document.querySelector('#find-form').onsubmit = function(e) {
    e.preventDefault();
    webview.find(document.forms['find-form']['find-text'].value,
     {matchCase: findMatchCase});
  }

  webview.addEventListener('findupdate', handleFindUpdate);
};

function reLayout()
{
  var webview = getWebView();
  webview.style.width = document.documentElement.clientWidth + 'px';
  webview.style.height = document.documentElement.clientHeight + 'px';
}

function getNextPresetZoom(zoomFactor)
{
  var preset = [0.25, 0.33, 0.5, 0.67, 0.75, 0.9, 1, 1.1, 1.25, 1.5, 1.75, 2, 2.5, 3, 4, 5];
  var low = 0;
  var high = preset.length - 1;
  var mid;
  while (high - low > 1) {
    mid = Math.floor((high + low)/2);
    if (preset[mid] < zoomFactor) {
      low = mid;
    } else if (preset[mid] > zoomFactor) {
      high = mid;
    } else {
      return {low: preset[mid - 1], high: preset[mid + 1]};
    }
  }
  return {low: preset[low], high: preset[high]};
}

function increaseZoom()
{
  var webview = getWebView();
  webview.getZoom(function(zoomFactor) {
    webview.setZoom(getNextPresetZoom(zoomFactor).high);
  });
}

function decreaseZoom()
{
  var webview = getWebView();
  webview.getZoom(function(zoomFactor) {
    webview.setZoom(getNextPresetZoom(zoomFactor).low);
  });
}

function handleKeyDown(event)
{
  if (event.ctrlKey && !event.altKey)
  {
    switch (event.keyCode)
    {
      case 107: // Ctrl++
      case 187:
        event.preventDefault();
        increaseZoom();
        break;

      case 109: // Ctrl+-
      case 189:
        event.preventDefault();
        decreaseZoom();
        break;

      case 70: // Ctrl+F
        event.preventDefault();
        isFindBoxVisible() ? closeFindBox() : openFindBox();
        break;

      case 81: // Ctrl+q
      case 87: // Ctrl+w
        event.preventDefault();
        if (event.shiftKey)
          window.close();
        break;

      case 82: // Ctrl+r
      case 115: // F5
        getWebView().reload();
        break;
    }
  }
}

function isFindBoxVisible()
{
  return document.querySelector('#find-box').style.display === 'block';
}

function openFindBox()
{
  document.querySelector('#find-box').style.display = 'block';
  document.forms['find-form']['find-text'].select();
}

function resetSearch()
{
  getWebView().stopFinding('activate');
}

function closeFindBox()
{
  resetSearch();
  var findBox = document.querySelector('#find-box');
  findBox.style.display = 'none';
  findBox.style.left = "";
  findBox.style.opacity = "";
  document.querySelector('#find-results').innerText= "";
}

function findNext()
{
  getWebView().find(document.forms['find-form']['find-text'].value,
     {matchCase: findMatchCase});
}

function findPrev()
{
  getWebView().find(document.forms['find-form']['find-text'].value,
     {backward: true, matchCase: findMatchCase});
}

function findBoxObscuresActiveMatch(findBoxRect, matchRect)
{
  return findBoxRect.left < matchRect.left + matchRect.width &&
      findBoxRect.right > matchRect.left &&
      findBoxRect.top < matchRect.top + matchRect.height &&
      findBoxRect.bottom > matchRect.top;
}

function handleFindUpdate(event)
{
  var findResults = document.querySelector('#find-results');
  if (event.searchText == "")
  {
    findResults.innerText = "";
  }
  else
  {
    findResults.innerText =
        event.activeMatchOrdinal + " of " + event.numberOfMatches;
  }

  // Ensure that the find box does not obscure the active match.
  if (event.finalUpdate && !event.canceled)
  {
    var findBox = document.querySelector('#find-box');
    findBox.style.left = "";
    findBox.style.opacity = "";
    var findBoxRect = findBox.getBoundingClientRect();
    if (findBoxObscuresActiveMatch(findBoxRect, event.selectionRect)) {
      // Move the find box out of the way if there is room on the screen, or
      // make it semi-transparent otherwise.
      var potentialLeft = event.selectionRect.left - findBoxRect.width - 10;
      if (potentialLeft >= 5)
      {
        findBox.style.left = potentialLeft + "px";
      }
      else
      {
        findBox.style.opacity = "0.5";
      }
    }
  }
}
