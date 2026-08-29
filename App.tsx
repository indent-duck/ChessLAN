import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useFonts, ArchivoBlack_400Regular } from "@expo-google-fonts/archivo-black";
import { GoogleSansFlex_400Regular, GoogleSansFlex_500Medium, GoogleSansFlex_700Bold } from "@expo-google-fonts/google-sans-flex";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";
import Home from "./screens/Home";
import HomeWiFi from "./screens/HomeWiFi";
import HomeHotspot from "./screens/HomeHotspot";
import HostGame from "./screens/HostGame";
import JoinGame from "./screens/JoinGame";
import GameRoom from "./screens/GameRoom";
import CustomTime from "./screens/CustomTime";

// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync();

const Stack = createNativeStackNavigator();

export default function App() {
  const [fontsLoaded] = useFonts({ ArchivoBlack_400Regular, GoogleSansFlex_400Regular, GoogleSansFlex_500Medium, GoogleSansFlex_700Bold });

  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) return null;

  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Home" screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Home" component={Home} />
        <Stack.Screen 
          name="HomeWiFi" 
          component={HomeWiFi} 
          options={{ animation: "slide_from_right" }} 
        />
        <Stack.Screen 
          name="HomeHotspot" 
          component={HomeHotspot} 
          options={{ animation: "slide_from_right" }} 
        />
        <Stack.Screen
          name="HostGame"
          component={HostGame}
          options={{ animation: "slide_from_bottom" }}
        />
        <Stack.Screen name="JoinGame" component={JoinGame} options={{ animation: "slide_from_bottom" }} />
        <Stack.Screen name="CustomTime" component={CustomTime} options={{ animation: "slide_from_bottom" }} />
        <Stack.Screen name="GameRoom" component={GameRoom} options={{ animation: "slide_from_bottom" }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
