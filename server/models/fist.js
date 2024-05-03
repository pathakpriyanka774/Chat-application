// // const varletFun = () => {
// //         var a = 12;
// //         let b = 13;

// //     }
// //console.log(a);
// //console.log(b);
// let str1 = "cat";
// let str2 = "actt";
// let count = 0;
// let charcount = 0;
// for (let i = 0; i <= str1.length; i++) {
//     for (let k = 0; k <= str1.length; k++) {
//         if (str1[i] == str1[k]) {
//             charcount++;
//         }
//     }
//     console.log(charcount);

//     // for(let j=0;j<=str2.length;j++){
//     //     if(str2[j]==str1[i])
//     //     {
//     //        count++;
//     //     }
//     // }

// }
function areStringsEqual(str1, str2) {
    // Create character frequency maps for both strings
    const charMap1 = createCharMap(str1);
    const charMap2 = createCharMap(str2);
    console.log("charMap1", charMap1);
    console.log("charMap2", charMap2);


    // Compare character frequencies
    for (const char in charMap1) {
        if (charMap1[char] !== charMap2[char]) {
            return false; // Character counts don't match
        }
    }

    // Check if all characters in str1 exist in str2
    for (const char of str1) {
        if (!charMap2[char]) {
            return false; // Character in str1 not found in str2
        }
    }

    return true; // Strings are equal
}

// Helper function to create character frequency map
function createCharMap(str) {
    const charMap = {};
    for (const char of str) {
        charMap[char] = (charMap[char] || 0) + 1;
    }
    return charMap;
}

// Test the function
const string1 = "catt";
const string2 = "act";
const result = areStringsEqual(string1, string2);
console.log(result ? "Strings are equal." : "Strings are not equal.");