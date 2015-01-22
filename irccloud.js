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
