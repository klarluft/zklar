import { ethers, network } from "hardhat";
import { Signer, BigNumber } from "ethers";
import { expect } from "chai";

import { Messages__factory, Messages } from "../typechain";
import { DEPOSIT_CONTRACT, DEPOSIT_VERIFIER_CONTRACT } from "../src/contracts";

const getContract = async () => {
  const Contract = ((await ethers.getContractFactory(DEPOSIT_VERIFIER_CONTRACT)) as unknown) as Messages__factory;
  return await Contract.deploy();
};

describe(MESSAGES, function () {
  let signers: Signer[];
  let accounts: string[];

  beforeEach(async function () {
    signers = await ethers.getSigners();
    accounts = [];

    for (let index = 0; index < signers.length; index++) {
      const signer = signers[index];
      accounts.push(await signer.getAddress());
    }
  });

  it(`creates an account`, async () => {
    const contract = await getContract();
    const [JohnSigner] = signers;
    const [John] = accounts;

    await contract
      .connect(JohnSigner)
      .create_account(ethers.utils.formatBytes32String("john"), "John Doe", "This is John's bio.");

    expect(await contract.connect(JohnSigner).get_accounts()).to.be.eql([John]);
    expect(await contract.connect(JohnSigner).get_handles()).to.be.eql([ethers.utils.formatBytes32String("john")]);
  });

  it(`posts messages`, async () => {
    const contract = await getContract();
    const [JohnSigner] = signers;
    const [John] = accounts;
    const handle = ethers.utils.formatBytes32String("john");
    const name = "John Doe";
    const bio = "This is John's bio.";

    await contract.connect(JohnSigner).create_account(handle, name, bio);

    const messages = ["This is message one ❤️", "This is message two 🌮"];
    await contract.connect(JohnSigner).post_message(messages[0]);
  });

  it(`gets an account by address`, async () => {
    const contract = await getContract();
    const [JohnSigner] = signers;
    const [John] = accounts;
    const handle = ethers.utils.formatBytes32String("john");
    const name = "John Doe";
    const bio = "This is John's bio.";

    await contract.connect(JohnSigner).create_account(handle, name, bio);

    const messages: Unpack<ReturnType<Messages["get_account_by_address"]>>["messages"] = [];

    const blockNumber = await ethers.provider.getBlockNumber();
    const { timestamp } = await ethers.provider.getBlock(blockNumber);

    const account: Head<Unpack<ReturnType<Messages["get_account_by_address"]>>> = [
      John,
      handle,
      name,
      bio,
      BigNumber.from(timestamp),
      true,
      messages,
    ];

    expect(await contract.connect(JohnSigner).get_account_by_address(John)).to.be.eql(account);
  });

  it(`gets an account by handle`, async () => {
    const contract = await getContract();
    const [JohnSigner] = signers;
    const [John] = accounts;
    const handle = ethers.utils.formatBytes32String("john");
    const name = "John Doe";
    const bio = "This is John's bio.";

    await contract.connect(JohnSigner).create_account(handle, name, bio);

    const messages: Unpack<ReturnType<Messages["get_account_by_handle"]>>["messages"] = [];

    const blockNumber = await ethers.provider.getBlockNumber();
    const { timestamp } = await ethers.provider.getBlock(blockNumber);

    const account: Head<Unpack<ReturnType<Messages["get_account_by_handle"]>>> = [
      John,
      handle,
      name,
      bio,
      BigNumber.from(timestamp),
      true,
      messages,
    ];

    expect(await contract.connect(JohnSigner).get_account_by_handle(handle)).to.be.eql(account);
  });

  // it(`assigns the Owner to DEFAULT_ADMIN_ROLE`, async () => {
  //   const contract = await getContract();
  //   const [Owner] = accounts;

  //   expect(await contract.hasRole(DEFAULT_ADMIN_ROLE, Owner)).to.be.true;
  // });

  // it(`does not assigns other users then Owner to DEFAULT_ADMIN_ROLE`, async () => {
  //   const contract = await getContract();
  //   const [, John, Anne] = accounts;

  //   expect(await contract.hasRole(DEFAULT_ADMIN_ROLE, John)).to.be.false;
  //   expect(await contract.hasRole(DEFAULT_ADMIN_ROLE, Anne)).to.be.false;
  // });

  // it(`allows DEFAULT_ADMIN_ROLE holder to grants and revokes DEFAULT_ADMIN_ROLE`, async () => {
  //   const contract = await getContract();
  //   const [, John] = accounts;

  //   expect(await contract.hasRole(DEFAULT_ADMIN_ROLE, John)).to.be.false;
  //   await contract.grantRole(DEFAULT_ADMIN_ROLE, John);
  //   expect(await contract.hasRole(DEFAULT_ADMIN_ROLE, John)).to.be.true;
  //   await contract.revokeRole(DEFAULT_ADMIN_ROLE, John);
  //   expect(await contract.hasRole(DEFAULT_ADMIN_ROLE, John)).to.be.false;
  // });

  // it(`allows DEFAULT_ADMIN_ROLE holder to grants and revokes CERTIFICATE_AUTHORITY_ADMIN_ROLE`, async () => {
  //   const contract = await getContract();
  //   const [, John] = accounts;

  //   expect(await contract.hasRole(CERTIFICATE_AUTHORITY_ADMIN_ROLE, John)).to.be.false;
  //   await contract.grantRole(CERTIFICATE_AUTHORITY_ADMIN_ROLE, John);
  //   expect(await contract.hasRole(CERTIFICATE_AUTHORITY_ADMIN_ROLE, John)).to.be.true;
  //   await contract.revokeRole(CERTIFICATE_AUTHORITY_ADMIN_ROLE, John);
  //   expect(await contract.hasRole(CERTIFICATE_AUTHORITY_ADMIN_ROLE, John)).to.be.false;
  // });

  // it(`does not allows DEFAULT_ADMIN_ROLE holder to grants and revokes CERTIFICATE_AUTHORITY_ROLE`, async () => {
  //   const contract = await getContract();
  //   const [, John] = accounts;

  //   expect(await contract.hasRole(CERTIFICATE_AUTHORITY_ROLE, John)).to.be.false;
  //   await expect(contract.grantRole(CERTIFICATE_AUTHORITY_ROLE, John)).to.be.revertedWith(
  //     "sender must be an admin to grant"
  //   );
  //   await expect(contract.revokeRole(CERTIFICATE_AUTHORITY_ROLE, John)).to.be.revertedWith(
  //     "sender must be an admin to revoke"
  //   );
  // });

  // it(`does not allow users that does not hold DEFAULT_ADMIN_ROLE to grants and revokes CERTIFICATE_AUTHORITY_ADMIN_ROLE `, async () => {
  //   const contract = await getContract();
  //   const [, JohnSigner] = signers;
  //   const [, John, Anne] = accounts;

  //   expect(await contract.hasRole(DEFAULT_ADMIN_ROLE, John)).to.be.false;

  //   await contract.grantRole(CERTIFICATE_AUTHORITY_ADMIN_ROLE, Anne);
  //   expect(await contract.hasRole(CERTIFICATE_AUTHORITY_ADMIN_ROLE, Anne)).to.be.true;

  //   await expect(contract.connect(JohnSigner).grantRole(CERTIFICATE_AUTHORITY_ADMIN_ROLE, John)).to.be.revertedWith(
  //     "sender must be an admin to grant"
  //   );
  //   await expect(contract.connect(JohnSigner).revokeRole(CERTIFICATE_AUTHORITY_ADMIN_ROLE, Anne)).to.be.revertedWith(
  //     "sender must be an admin to revoke"
  //   );
  // });

  // it(`does not allow CERTIFICATE_AUTHORITY_ADMIN_ROLE holders to grants and revokes CERTIFICATE_AUTHORITY_ADMIN_ROLE `, async () => {
  //   const contract = await getContract();
  //   const [, JohnSigner] = signers;
  //   const [, John, Anne, Bob] = accounts;

  //   await contract.grantRole(CERTIFICATE_AUTHORITY_ADMIN_ROLE, John);
  //   expect(await contract.hasRole(CERTIFICATE_AUTHORITY_ADMIN_ROLE, John)).to.be.true;
  //   await contract.grantRole(CERTIFICATE_AUTHORITY_ADMIN_ROLE, Anne);
  //   expect(await contract.hasRole(CERTIFICATE_AUTHORITY_ADMIN_ROLE, Anne)).to.be.true;
  //   expect(await contract.hasRole(CERTIFICATE_AUTHORITY_ADMIN_ROLE, Bob)).to.be.false;

  //   await expect(contract.connect(JohnSigner).grantRole(CERTIFICATE_AUTHORITY_ADMIN_ROLE, Bob)).to.be.revertedWith(
  //     "sender must be an admin to grant"
  //   );
  //   await expect(contract.connect(JohnSigner).revokeRole(CERTIFICATE_AUTHORITY_ADMIN_ROLE, Anne)).to.be.revertedWith(
  //     "sender must be an admin to revoke"
  //   );
  // });

  // it(`allows holder of CERTIFICATE_AUTHORITY_ADMIN_ROLE to grants and revokes CERTIFICATE_AUTHORITY_ROLE`, async () => {
  //   const contract = await getContract();
  //   const [, JohnSigner] = signers;
  //   const [, John, Anne] = accounts;

  //   await contract.grantRole(CERTIFICATE_AUTHORITY_ADMIN_ROLE, John);
  //   expect(await contract.hasRole(CERTIFICATE_AUTHORITY_ADMIN_ROLE, John)).to.be.true;

  //   expect(await contract.hasRole(CERTIFICATE_AUTHORITY_ROLE, Anne)).to.be.false;
  //   await contract.connect(JohnSigner).grantRole(CERTIFICATE_AUTHORITY_ROLE, Anne);
  //   expect(await contract.hasRole(CERTIFICATE_AUTHORITY_ROLE, Anne)).to.be.true;
  //   await contract.connect(JohnSigner).revokeRole(CERTIFICATE_AUTHORITY_ROLE, Anne);
  //   expect(await contract.hasRole(CERTIFICATE_AUTHORITY_ROLE, Anne)).to.be.false;
  // });

  // it(`does not allow CERTIFICATE_AUTHORITY_ROLE holders to grants and revokes CERTIFICATE_AUTHORITY_ROLE `, async () => {
  //   const contract = await getContract();
  //   const [, JohnSigner] = signers;
  //   const [Owner, John, Anne, Bob] = accounts;

  //   await contract.grantRole(CERTIFICATE_AUTHORITY_ADMIN_ROLE, Owner);
  //   expect(await contract.hasRole(CERTIFICATE_AUTHORITY_ADMIN_ROLE, Owner)).to.be.true;

  //   await contract.grantRole(CERTIFICATE_AUTHORITY_ROLE, John);
  //   expect(await contract.hasRole(CERTIFICATE_AUTHORITY_ROLE, John)).to.be.true;
  //   await contract.grantRole(CERTIFICATE_AUTHORITY_ROLE, Anne);
  //   expect(await contract.hasRole(CERTIFICATE_AUTHORITY_ROLE, Anne)).to.be.true;
  //   expect(await contract.hasRole(CERTIFICATE_AUTHORITY_ROLE, Bob)).to.be.false;

  //   await expect(contract.connect(JohnSigner).grantRole(CERTIFICATE_AUTHORITY_ROLE, Bob)).to.be.revertedWith(
  //     "sender must be an admin to grant"
  //   );
  //   await expect(contract.connect(JohnSigner).revokeRole(CERTIFICATE_AUTHORITY_ROLE, Anne)).to.be.revertedWith(
  //     "sender must be an admin to revoke"
  //   );
  // });

  // it(`does not allow users that does not hold CERTIFICATE_AUTHORITY_ROLE to call issueCertificate`, async () => {
  //   const contract = await getContract();
  //   const [Owner, John] = accounts;

  //   expect(await contract.hasRole(CERTIFICATE_AUTHORITY_ROLE, Owner)).to.be.false;

  //   const signature = getCertificateSignature("DE", "ABCDEF1", "1");

  //   await expect(contract.issueCertificate(signature)).to.be.revertedWith("Caller is not a Certificate Authority");
  // });

  // it(`successfully issue a certificate`, async () => {
  //   const contract = await getContract();
  //   const [Owner] = accounts;

  //   await contract.grantRole(CERTIFICATE_AUTHORITY_ADMIN_ROLE, Owner);
  //   await contract.grantRole(CERTIFICATE_AUTHORITY_ROLE, Owner);
  //   expect(await contract.hasRole(CERTIFICATE_AUTHORITY_ROLE, Owner)).to.be.true;

  //   const signature = getCertificateSignature("DE", "ABCDEF1", "1");

  //   await contract.issueCertificate(signature);

  //   const lastBlockTimestamp = (await ethers.provider.getBlock("latest")).timestamp;

  //   const certificate = await contract.certificates(signature);

  //   expect(certificate.signature).to.equal(signature);
  //   expect(certificate.authority).to.equal(Owner);
  //   expect(certificate.timestamp.toNumber()).to.equal(lastBlockTimestamp);
  // });

  // it(`does not allow to overwrite existing certificate`, async () => {
  //   const contract = await getContract();
  //   const [Owner] = accounts;

  //   await contract.grantRole(CERTIFICATE_AUTHORITY_ADMIN_ROLE, Owner);
  //   await contract.grantRole(CERTIFICATE_AUTHORITY_ROLE, Owner);
  //   expect(await contract.hasRole(CERTIFICATE_AUTHORITY_ROLE, Owner)).to.be.true;

  //   const signature = getCertificateSignature("DE", "ABCDEF1", "1");

  //   await contract.issueCertificate(signature);
  //   await expect(contract.issueCertificate(signature)).to.be.revertedWith("Can't overwrite existing certificate");
  // });

  // it(`allows to retrieve all certificate signatures`, async () => {
  //   const contract = await getContract();
  //   const [Owner] = accounts;

  //   await contract.grantRole(CERTIFICATE_AUTHORITY_ADMIN_ROLE, Owner);
  //   await contract.grantRole(CERTIFICATE_AUTHORITY_ROLE, Owner);
  //   expect(await contract.hasRole(CERTIFICATE_AUTHORITY_ROLE, Owner)).to.be.true;

  //   const signatures = [
  //     getCertificateSignature("DE", "ABCDEF1", "1"),
  //     getCertificateSignature("DE", "ABCDEF2", "2"),
  //     getCertificateSignature("DE", "ABCDEF3", "3"),
  //     getCertificateSignature("DE", "ABCDEF4", "4"),
  //   ];

  //   await contract.issueCertificate(signatures[0]);
  //   await contract.issueCertificate(signatures[1]);
  //   await contract.issueCertificate(signatures[2]);
  //   await contract.issueCertificate(signatures[3]);

  //   expect(await contract.getSignatures()).to.deep.equal(signatures);
  // });

  // it(`sets a certificate authority's name`, async () => {
  //   const contract = await getContract();
  //   const [Owner, John] = accounts;

  //   await contract.grantRole(CERTIFICATE_AUTHORITY_ADMIN_ROLE, Owner);
  //   await contract.grantRole(CERTIFICATE_AUTHORITY_ROLE, John);
  //   expect(await contract.hasRole(CERTIFICATE_AUTHORITY_ROLE, John)).to.be.true;

  //   const name = "Certificate Authority Name";
  //   const nameInBytes32String = ethers.utils.formatBytes32String(name);
  //   expect(nameInBytes32String).to.equal("0x436572746966696361746520417574686f72697479204e616d65000000000000");
  //   expect(ethers.utils.parseBytes32String(nameInBytes32String)).to.equal(name);

  //   await contract.setCertificateAuthorityName(John, nameInBytes32String);

  //   const returnedNameInBytes32String = await contract.certificateAuthorityNames(John);

  //   expect(returnedNameInBytes32String).to.deep.equal(nameInBytes32String);
  //   expect(ethers.utils.parseBytes32String(returnedNameInBytes32String)).to.deep.equal(name);
  // });

  // it("does not allow users without CERTIFICATE_AUTHORITY_ADMIN_ROLE to set a certificate authority name", async () => {
  //   const contract = await getContract();
  //   const [, , AnneSigner] = signers;
  //   const [Owner, John, Anne] = accounts;

  //   await contract.grantRole(CERTIFICATE_AUTHORITY_ADMIN_ROLE, Owner);
  //   await contract.grantRole(CERTIFICATE_AUTHORITY_ROLE, John);
  //   expect(await contract.hasRole(CERTIFICATE_AUTHORITY_ROLE, John)).to.be.true;
  //   expect(await contract.hasRole(CERTIFICATE_AUTHORITY_ADMIN_ROLE, Anne)).to.be.false;

  //   const name = "Certificate Authority Name";
  //   const nameInBytes32String = ethers.utils.formatBytes32String(name);

  //   await expect(
  //     contract.connect(AnneSigner).setCertificateAuthorityName(John, nameInBytes32String)
  //   ).to.be.revertedWith("Caller is not a Certificate Authority Admin");
  // });

  // it("does not allow to set a certificate authority name to account that does not has a CERTIFICATE_AUTHORITY_ROLE", async () => {
  //   const contract = await getContract();
  //   const [, , AnneSigner] = signers;
  //   const [Owner, John, Anne] = accounts;

  //   await contract.grantRole(CERTIFICATE_AUTHORITY_ADMIN_ROLE, Owner);
  //   await contract.grantRole(CERTIFICATE_AUTHORITY_ADMIN_ROLE, Anne);
  //   expect(await contract.hasRole(CERTIFICATE_AUTHORITY_ADMIN_ROLE, Anne)).to.be.true;
  //   expect(await contract.hasRole(CERTIFICATE_AUTHORITY_ROLE, John)).to.be.false;

  //   const name = "Certificate Authority Name";
  //   const nameInBytes32String = ethers.utils.formatBytes32String(name);

  //   await expect(
  //     contract.connect(AnneSigner).setCertificateAuthorityName(John, nameInBytes32String)
  //   ).to.be.revertedWith("Given address is not a Certificate Authority");
  // });
});
