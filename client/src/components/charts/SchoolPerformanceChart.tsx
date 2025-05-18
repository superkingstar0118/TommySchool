import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884D8"];

const generateMockSchoolData = () => {
  const schools = [
    "Oakridge High School",
    "Riverside Elementary",
    "Lincoln Middle School",
    "Washington Technical Institute",
    "Parkview Academy"
  ];
  
  return schools.map(name => {
    return {
      name: name,
      value: Math.round((Math.random() * 2 + 3) * 10) / 10, // Average score between 3-5
    }
  });
};

const SchoolPerformanceChart = () => {
  // In a real app, this data would come from the API
  const data = generateMockSchoolData();
  
  return (
    <ResponsiveContainer width="100%" height="100%">
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          labelLine={true}
          label={({ name, value }) => `${name}: ${value}`}
          outerRadius={120}
          fill="#8884d8"
          dataKey="value"
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip formatter={(value) => [`${value}/5`, "Average Score"]} />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  );
};

export default SchoolPerformanceChart;