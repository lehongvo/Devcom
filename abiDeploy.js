const abi = [
    {
        "inputs": [
          {
            "internalType": "address payable[]",
            "name": "_stakeHolders",
            "type": "address[]"
          },
          {
            "internalType": "address",
            "name": "_createByToken",
            "type": "address"
          },
          {
            "internalType": "address[]",
            "name": "_erc721Address",
            "type": "address[]"
          },
          {
            "internalType": "uint256[]",
            "name": "_primaryRequired",
            "type": "uint256[]"
          },
          {
            "internalType": "address payable[]",
            "name": "_awardReceivers",
            "type": "address[]"
          },
          {
            "internalType": "uint256",
            "name": "_index",
            "type": "uint256"
          },
          {
            "internalType": "bool[]",
            "name": "_allowGiveUp",
            "type": "bool[]"
          },
          {
            "internalType": "uint256[]",
            "name": "_gasData",
            "type": "uint256[]"
          },
          {
            "internalType": "bool",
            "name": "_allAwardToSponsorWhenGiveUp",
            "type": "bool"
          },
          {
            "internalType": "uint256[]",
            "name": "_awardReceiversPercent",
            "type": "uint256[]"
          },
          {
            "internalType": "uint256",
            "name": "_totalAmount",
            "type": "uint256"
          },
          {
            "internalType": "uint256[]",
            "name": "_walkingSpeedData",
            "type": "uint256[]"
          }
        ],
        "stateMutability": "payable",
        "type": "constructor"
      },
]

const encodeData = "000000000000000000000000000000000000000000000000000000000000018000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000200000000000000000000000000000000000000000000000000000000000000024000000000000000000000000000000000000000000000000000000000000003000000000000000000000000000000000000000000000000000000000000000001000000000000000000000000000000000000000000000000000000000000036000000000000000000000000000000000000000000000000000000000000003e00000000000000000000000000000000000000000000000000000000000000001000000000000000000000000000000000000000000000000000000000000046000000000000000000000000000000000000000000000000000082bd67afbc00000000000000000000000000000000000000000000000000000000000000004c000000000000000000000000000000000000000000000000000000000000000030000000000000000000000003ffe910ad8bc71f78d12f5b8fb244c655a91a7c90000000000000000000000003ffe910ad8bc71f78d12f5b8fb244c655a91a7c9000000000000000000000000e906c97a940911b92159629b89dbe75d55df567c000000000000000000000000000000000000000000000000000000000000000100000000000000000000000055285eccef5487e87c5980c880131acadde7767c0000000000000000000000000000000000000000000000000000000000000005000000000000000000000000000000000000000000000000000000000000000a0000000000000000000000000000000000000000000000000000000069497505000000000000000000000000000000000000000000000000000000006955568f00000000000000000000000000000000000000000000000000000000000000ff000000000000000000000000000000000000000000000000000000000000000700000000000000000000000000000000000000000000000000000000000000020000000000000000000000003ffe910ad8bc71f78d12f5b8fb244c655a91a7c90000000000000000000000003ffe910ad8bc71f78d12f5b8fb244c655a91a7c90000000000000000000000000000000000000000000000000000000000000003000000000000000000000000000000000000000000000000000000000000000100000000000000000000000000000000000000000000000000000000000000010000000000000000000000000000000000000000000000000000000000000001000000000000000000000000000000000000000000000000000000000000000300000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000020000000000000000000000000000000000000000000000000000000000000064000000000000000000000000000000000000000000000000000000000000006400000000000000000000000000000000000000000000000000000000000000030000000000000000000000000000000000000000000000000000000000000004000000000000000000000000000000000000000000000000000000000000006a0000000000000000000000000000000000000000000000000000000000000007"

// Sử dụng ethers.js để decode constructor parameters
const { ethers } = require('ethers');

/**
 * Decode constructor parameters từ encoded data
 * Lưu ý: Constructor không có function selector (4 bytes đầu tiên)
 * nên decode trực tiếp bằng AbiCoder với types từ ABI
 */
function decodeConstructorData() {
    try {
        // Tạo AbiCoder instance
        const abiCoder = new ethers.AbiCoder();
        
        // Lấy constructor ABI (phần tử đầu tiên trong mảng abi)
        const constructorABI = abi[0];
        
        // Kiểm tra xem có phải constructor không
        if (constructorABI.type !== 'constructor') {
            throw new Error('ABI đầu tiên không phải là constructor');
        }
        
        // Lấy danh sách types từ constructor inputs
        const types = constructorABI.inputs.map(input => input.type);
        
        console.log('📝 Decoding Constructor Parameters...');
        console.log(`   Total parameters: ${types.length}`);
        console.log(`   Encoded data length: ${encodeData.length} characters\n`);
        
        // Decode data (constructor không có function selector nên decode trực tiếp)
        // Chuẩn hóa hex string
        let dataHex = encodeData.startsWith('0x') ? encodeData : '0x' + encodeData;
        dataHex = dataHex.replace(/\s/g, '');
        
        // Convert hex string sang Uint8Array bằng Buffer (tránh vấn đề với chuỗi quá dài)
        const hexWithoutPrefix = dataHex.startsWith('0x') ? dataHex.slice(2) : dataHex;
        const buffer = Buffer.from(hexWithoutPrefix, 'hex');
        const dataBytes = new Uint8Array(buffer);
        
        // Decode với Uint8Array
        const decoded = abiCoder.decode(types, dataBytes);
        
        console.log('═══════════════════════════════════════════════════════════');
        console.log('Decoded Constructor Parameters:');
        console.log('═══════════════════════════════════════════════════════════\n');
        
        // Hiển thị từng tham số đã decode
        constructorABI.inputs.forEach((input, index) => {
            console.log(`${index + 1}. ${input.name}`);
            console.log(`   Type: ${input.type}`);
            
            const value = decoded[index];
            
            // Format output theo kiểu dữ liệu
            if (Array.isArray(value)) {
                console.log(`   Value: [${value.length} items]`);
                value.forEach((item, i) => {
                    if (typeof item === 'bigint') {
                        console.log(`      [${i}]: ${item.toString()}`);
                    } else {
                        console.log(`      [${i}]: ${item}`);
                    }
                });
            } else if (typeof value === 'bigint') {
                console.log(`   Value: ${value.toString()}`);
            } else {
                console.log(`   Value: ${value}`);
            }
            console.log('');
        });
        
        // Tạo object kết quả với tên tham số
        const result = {};
        constructorABI.inputs.forEach((input, index) => {
            const value = decoded[index];
            
            // Convert BigInt to string để có thể JSON.stringify
            if (Array.isArray(value)) {
                result[input.name] = value.map(v => {
                    if (typeof v === 'bigint') {
                        return v.toString();
                    }
                    return v;
                });
            } else if (typeof value === 'bigint') {
                result[input.name] = value.toString();
            } else {
                result[input.name] = value;
            }
        });
        
        console.log('═══════════════════════════════════════════════════════════');
        console.log('📋 Decoded Data as JSON Object:');
        console.log('═══════════════════════════════════════════════════════════');
        console.log(JSON.stringify(result, null, 2));
        
        return result;
    } catch (error) {
        console.error('\n❌ Error decoding constructor data:');
        console.error(`   Message: ${error.message}`);
        if (error.stack) {
            console.error(`   Stack: ${error.stack}`);
        }
        throw error;
    }
}

// Chạy decode
console.log('🚀 Starting decode process...\n');
try {
    const decoded = decodeConstructorData();
    console.log('\n═══════════════════════════════════════════════════════════');
    console.log('✅ Decode completed successfully!');
    console.log('═══════════════════════════════════════════════════════════\n');
} catch (error) {
    console.log('\n═══════════════════════════════════════════════════════════');
    console.error('❌ Decode failed!');
    console.log('═══════════════════════════════════════════════════════════\n');
    process.exit(1);
}