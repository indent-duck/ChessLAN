import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useFonts, ArchivoBlack_400Regular } from "@expo-google-fonts/archivo-black";
import { GoogleSansFlex_400Regular, GoogleSansFlex_500Medium, GoogleSansFlex_700Bold } from "@expo-google-fonts/google-sans-flex";
import SelectMode from "./screens/SelectMode";
import Home from "./screens/Home";
import HostGame from "./screens/HostGame";
import JoinGame from "./screens/JoinGame";
import GameRoom from "./screens/GameRoom";
import CustomTime from "./screens/CustomTime";

const Stack = createNativeStackNavigator();

export default function App() {
  const [fontsLoaded] = useFonts({ ArchivoBlack_400Regular, GoogleSansFlex_400Regular, GoogleSansFlex_500Medium, GoogleSansFlex_700Bold });
  if (!fontsLoaded) return null;

  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Home" screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Home" component={Home} />
        <Stack.Screen
          name="SelectMode"
          component={SelectMode}
          options={{ animation: "slide_from_bottom" }}
        />
        <Stack.Screen name="HostGame" component={HostGame} options={{ animation: "slide_from_bottom" }} />
        <Stack.Screen name="JoinGame" component={JoinGame} options={{ animation: "slide_from_bottom" }} />
        <Stack.Screen name="CustomTime" component={CustomTime} options={{ animation: "slide_from_bottom" }} />
        <Stack.Screen name="GameRoom" component={GameRoom} options={{ animation: "slide_from_bottom" }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
