//! FieldLink core protocol engine stubs

#[derive(Debug, Clone)]
pub struct DeviceAddress {
    pub address: String,
}

#[derive(Debug, Clone)]
pub struct Point {
    pub name: String,
    pub address: String,
}

pub trait ModbusClient {
    fn read_holding_registers(&self, start: u16, count: u16) -> Result<Vec<u16>, String>;
    fn read_input_registers(&self, start: u16, count: u16) -> Result<Vec<u16>, String>;
    fn write_multiple_registers(&self, start: u16, values: &[u16]) -> Result<(), String>;
}

pub trait BacnetClient {
    fn discover_devices(&self) -> Result<Vec<DeviceAddress>, String>;
    fn read_property(&self, device: &DeviceAddress, object_id: &str, property: &str) -> Result<String, String>;
}

pub trait SnmpClient {
    fn get_oid(&self, target: &DeviceAddress, oid: &str) -> Result<String, String>;
}
