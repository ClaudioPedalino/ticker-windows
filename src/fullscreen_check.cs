using System;
using System.Runtime.InteropServices;

namespace FullScreenCheck
{
    class Program
    {
        [DllImport("shell32.dll")]
        static extern int SHQueryUserNotificationState(out int pquns);

        static void Main(string[] args)
        {
            int state;
            SHQueryUserNotificationState(out state);
            // 2 = QUNS_BUSY (Full screen App/Game)
            // 3 = QUNS_RUNNING_D3D_FULL_SCREEN
            // 4 = QUNS_PRESENTATION_MODE
            // 7 = QUNS_APP
            if (state == 2 || state == 3 || state == 4 || state == 7)
            {
                Console.WriteLine("true");
            }
            else
            {
                Console.WriteLine("false");
            }
        }
    }
}
