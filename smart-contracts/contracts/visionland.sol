// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IERC20 {
    function transferFrom(address sender, address recipient, uint amount) external returns (bool);
    function allowance(address owner, address spender) external view returns (uint);
}

contract RentManagement {

    enum Role { None, Owner, Tenant }
    enum HouseStatus { Available, Rented }

    struct House {
        address owner;
        string houseAddress;
        uint rentAmount;
        uint dueDate;
        uint penaltyAmount;
        HouseStatus status;
    }

    struct Tenant {
        bool isVerified;
        uint balancePaid;
        uint lastPaymentDate;
        uint rentApprovalAmount;
        bool rentApproved;
    }

    mapping(address => House) public houses;
    mapping(address => address[]) public houseTenants;
    mapping(address => mapping(address => Tenant)) public tenants;
    mapping(address => Role) public userRoles;

    IERC20 public token;

    event RentPaid(address indexed owner, address indexed tenant, uint amount);
    event RentLate(address indexed owner, address indexed tenant, uint penalty);
    event UserRegistered(address indexed user, Role role);
    event HouseAdded(address indexed owner, string houseAddress, HouseStatus status);

    modifier onlyOwner(address houseOwner) {
        require(msg.sender == houseOwner, "Only owner can modify house details");
        _;
    }

    constructor(address _token) {
        token = IERC20(_token);
    }

    function userRegister(Role role) public {
        require(role != Role.None, "Invalid role");
        require(userRoles[msg.sender] == Role.None, "User already registered");

        if (role == Role.Owner) {
            require(houses[msg.sender].owner == address(0), "Already a house owner");
        } else if (role == Role.Tenant) {
            require(tenants[msg.sender][msg.sender].isVerified == false, "Already a tenant registered");
        }

        userRoles[msg.sender] = role;
        emit UserRegistered(msg.sender, role);
    }

    function addHouse(address tenant, string memory houseAddress, uint rentAmount, uint dueDate, uint penaltyAmount, HouseStatus status) public onlyOwner(msg.sender) {
        if (status == HouseStatus.Rented) {
            require(rentAmount > 0, "Rent amount must be greater than zero");
            require(tenant != address(0), "Invalid tenant address");
            require(dueDate > block.timestamp, "Due date must be in the future");

            houses[msg.sender] = House(msg.sender, houseAddress, rentAmount, dueDate, penaltyAmount, status);
            tenants[msg.sender][tenant] = Tenant(true, 0, block.timestamp, rentAmount, false); // Mark tenant as verified
            houseTenants[msg.sender].push(tenant);
        } else if (status == HouseStatus.Available) {
            houses[msg.sender] = House(msg.sender, houseAddress, rentAmount, dueDate, penaltyAmount, status);
        }
    }

    function getRentDue(address tenant) public view returns (uint totalAmountDue) {
        House storage house = houses[msg.sender];
        Tenant storage tenantInfo = tenants[msg.sender][tenant];

        uint amountDue = house.rentAmount;
        uint overdueDays = 0;

        if (block.timestamp > house.dueDate) {
            overdueDays = (block.timestamp - house.dueDate) / 1 days;
            uint penalty = (overdueDays / 30) * house.penaltyAmount;
            amountDue += penalty;
            return amountDue;
        }

        return amountDue;
    }

    function payRent() public {
        House storage house = houses[msg.sender];
        Tenant storage tenantInfo = tenants[msg.sender][msg.sender];

        require(tenantInfo.isVerified, "Tenant not verified");

        uint amountDue = getRentDue(msg.sender);
        uint approvedAmount = tenantInfo.rentApprovalAmount;

        require(token.allowance(msg.sender, address(this)) >= amountDue, "Insufficient approval for rent payment");

        token.transferFrom(msg.sender, house.owner, amountDue);

        tenantInfo.balancePaid += amountDue;
        tenantInfo.lastPaymentDate = block.timestamp;

        emit RentPaid(house.owner, msg.sender, amountDue);

        if (block.timestamp > house.dueDate) {
            emit RentLate(house.owner, msg.sender, amountDue - house.rentAmount);
        }
    }

    function isRentOverdue(address owner, address tenant) public view returns (bool) {
        House storage house = houses[owner];
        Tenant storage tenantInfo = tenants[owner][tenant];
        return block.timestamp > house.dueDate && tenantInfo.balancePaid < house.rentAmount;
    }
}
