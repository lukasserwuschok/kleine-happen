using KleineHappen.Services;

namespace KleineHappen;

public partial class MainPage : ContentPage
{
    public MainPage()
    {
        InitializeComponent();
        // JavaScript calls window.HybridWebView.InvokeDotNet("Save", [...]) etc. on this object.
        WebView.SetInvokeJavaScriptTarget(new AppBridge());
#if ANDROID
        QuickActions.Arrived += OnQuickAction;
#endif
    }

#if ANDROID
    // Shortcut used while the app is open: let the page fetch and run it.
    private void OnQuickAction() =>
        MainThread.BeginInvokeOnMainThread(async () =>
        {
            try { await WebView.EvaluateJavaScriptAsync("window.kickQuick && window.kickQuick()"); }
            catch { /* page not ready yet; it asks for pending shortcuts when it loads */ }
        });
#endif

    // Android back button: let the page close an open sheet or go back to "Heute" first.
    protected override bool OnBackButtonPressed()
    {
        _ = HandleBackAsync();
        return true;
    }

    private async Task HandleBackAsync()
    {
        try
        {
            var result = await WebView.EvaluateJavaScriptAsync("window.appBack ? window.appBack() : false");
            if (result?.Trim('"') == "true")
                return;
        }
        catch
        {
            // Page not ready: fall through and leave the app.
        }

#if ANDROID
        Platform.CurrentActivity?.MoveTaskToBack(true);
#endif
    }
}
