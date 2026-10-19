// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract QuarterlyReport {
    address public immutable dao;

    struct Report {
        uint256 quarter;
        uint256 year;
        uint256 totalInvested;
        uint256 totalReturns;
        int256 netPnL;
        uint256 activeMembers;
        uint256 proposalsExecuted;
    }

    mapping(uint256 => Report) public quarterlyReports;
    uint256 public lastReportId;

    event QuarterlyReportGenerated(uint256 indexed reportId, uint256 quarter, uint256 year);

    modifier onlyDAO() {
        require(msg.sender == dao, "Seule la DAO peut generer un rapport");
        _;
    }

    constructor(address _dao) {
        require(_dao != address(0), "Adresse DAO invalide");
        dao = _dao;
    }

    function generateQuarterlyReport(
        uint256 _totalInvested,
        uint256 _totalReturns,
        int256 _netPnL,
        uint256 _activeMembers,
        uint256 _proposalsExecuted
    ) external onlyDAO {
        uint256 year = getYear(block.timestamp);
        uint256 quarter = getQuarter(block.timestamp);
        lastReportId++;
        quarterlyReports[lastReportId] = Report({
            quarter: quarter,
            year: year,
            totalInvested: _totalInvested,
            totalReturns: _totalReturns,
            netPnL: _netPnL,
            activeMembers: _activeMembers,
            proposalsExecuted: _proposalsExecuted
        });
        emit QuarterlyReportGenerated(lastReportId, quarter, year);
    }

    function getYear(uint256 timestamp) public pure returns (uint256) {
        // Année depuis 1970
        return (timestamp / 31556926) + 1970;
    }

    function getQuarter(uint256 timestamp) public pure returns (uint256) {
        uint256 month = ((timestamp / 2629743) % 12) + 1;
        if (month <= 3) return 1;
        if (month <= 6) return 2;
        if (month <= 9) return 3;
        return 4;
    }
}
