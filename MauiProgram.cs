namespace KleineHappen;

public static class MauiProgram
{
    public static MauiApp CreateMauiApp()
    {
        var builder = MauiApp.CreateBuilder();
        builder.UseMauiApp<App>();

#if DEBUG
        // Lets you inspect the page with chrome://inspect while debugging.
        builder.Services.AddHybridWebViewDeveloperTools();
#endif

        return builder.Build();
    }
}
