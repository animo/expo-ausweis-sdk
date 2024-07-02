import { View, Text, StyleSheet } from "react-native";

export default function App() {
	return (
		<View
			style={[
				StyleSheet.absoluteFill,
				{ flex: 1, alignContent: "center", justifyContent: "center" },
			]}
		>
			<Text>Hello</Text>
		</View>
	);
}
