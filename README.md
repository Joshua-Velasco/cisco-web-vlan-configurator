# Cisco VLAN Configuration Generator

![React](https://img.shields.io/badge/react-%2320232a.svg?style=for-the-badge&logo=react&logoColor=%2361DAFB)
![Vite](https://img.shields.io/badge/vite-%23646CFF.svg?style=for-the-badge&logo=vite&logoColor=white)
![CSS3](https://img.shields.io/badge/css3-%231572B6.svg?style=for-the-badge&logo=css3&logoColor=white)
![License](https://img.shields.io/badge/license-MIT-blue.svg?style=for-the-badge)

A powerful, web-based tool designed to streamline the creation of Cisco switch configurations. It allows network engineers and students to visually design their network topology, manage VLANs, assign ports, and automatically generate the necessary CLI commands for deployment.

![App Screenshot](https://via.placeholder.com/1200x600?text=App+Screenshot+Placeholder)
_Replace this with an actual screenshot of your application_

## 🚀 Features

- **Global VLAN Management**: Easily create, edit, and manage VLANs that apply across your entire network topology.
- **Dynamic Switch Configuration**:
  - Add multiple switches instantly.
  - Configure switches as **Core/Bridge** (passing all VLAN traffic) or **Access** switches.
  - Select specific VLANs for each switch.
- **Port Management**:
  - **Access Ports**: Assign specific interfaces (e.g., `fa0/1`, `fa0/1-5`) to VLANs.
  - **Trunk Ports**: Define trunk ports (e.g., `gi0/1`) with native VLAN support (Default: 99).
- **IP Address Management**:
  - **Automatic Generation**: Generates PC IP allocations based on switch port assignments.
  - **Manual Overrides**: customization of PC Names, IPs, and Descriptions.
- **One-Click Export**:
  - Copy generated CLI commands to clipboard.
  - Download individual switch configurations as `.txt` files.
  - Export a master list of all PC IP allocations.
- **Visual Preview**: Real-time preview of the generated IOS commands as you edit.

## 🛠️ Installation

To run this project locally, follow these steps:

1.  **Clone the repository**:

    ```bash
    git clone https://github.com/Joshua-Velasco/cisco-web-vlan-configurator.git
    cd cisco-web-vlan-configurator
    ```

2.  **Install dependencies**:

    ```bash
    npm install
    # or
    yarn
    ```

3.  **Start the development server**:

    ```bash
    npm run dev
    # or
    yarn dev
    ```

4.  **Open your browser**:
    Navigate to `http://localhost:5173` (or the URL shown in your terminal).

## 📖 Usage

1.  **Define Global VLANs**: Start by listing all the VLANs required for your network in the first column.
2.  **Add Switches**: Use the "Create Multiple" or "New Switch" buttons to add devices to your topology.
3.  **Configure Interfaces**:
    - Select a switch tab.
    - Toggle "Switch Central/Puente" if it's a core switch.
    - Check the VLANs active on this switch and assign interface ranges (e.g., `fa0/1-10`).
    - Add Trunk ports if this switch connects to other network devices.
4.  **Manage IPs**: The tool automatically outlines IP allocations based on your port mappings. You can manually refine these in the "IPs de PCs" section.
5.  **Generate & Deploy**: Scroll to the preview section to see your commands. Click **Copy CLI** or **Download .txt** to get your configuration.

## 🤝 Contributing

Contributions are what make the open source community such an amazing place to learn, inspire, and create. Any contributions you make are **greatly appreciated**.

See [CONTRIBUTING.md](CONTRIBUTING.md) for detailed guidelines.

## 📝 License

Distributed under the MIT License. See [LICENSE](LICENSE) for more information.

---

<p align="center">
  Made with ❤️ by <a href="https://github.com/Joshua-Velasco">Joshua Velasco</a>
</p>
