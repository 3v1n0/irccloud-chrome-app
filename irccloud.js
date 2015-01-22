window.onresize = reLayout;

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
  if (event.ctrlKey) {
    switch (event.keyCode) {
      // Ctrl++.
      case 107:
      case 187:
        event.preventDefault();
        increaseZoom();
        break;

      // Ctrl+-.
      case 109:
      case 189:
        event.preventDefault();
        decreaseZoom();
        break;
    }
  }
}
